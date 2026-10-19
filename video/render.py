"""Render the Siflo film frame by frame with the local Chrome on the GPU: the site's 3D acts in
?capture mode, driven on a virtual clock, with the overlay of film.js / film.css on top.
1080 × 1920 (viewport 540 × 960 at 2×), 30 fps. Also writes the visual events (whistle rings,
packets, vibrations, SOS) with their times, which music.py turns into sound effects.

    python3 -m http.server 8792 --bind 127.0.0.1 &          # from the repository root
    uv run --with playwright python video/render.py --lang=fr            # video/out/clean-fr.mp4 + events-fr.json
    uv run --with playwright python video/render.py --lang=en --still=3,12,20   # stills only, for checking
    uv run --with playwright python video/render.py --lang=fr --from=17.5 --to=25   # a part, to a separate file
"""
import asyncio, json, pathlib, shutil, subprocess, sys
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).parent
FPS, W, H, DUR = 30, 540, 960, 48.0

# Shots: start s, end s, act, keys (film time s, panel coordinate), options.
# The panel coordinate is the site's: 0 = first card of the act centred, 1 = second card…
# Between keys the coordinate eases (smoothstep), so a key is held where the action needs time.
# zoom tightens the site's portrait framing for the video.
SHOTS = [
    (0.0, 5.0, 'canyon', [(0, -1.0), (5, 0.5)], {'restart': True}),            # fly into the gorge at dusk
    (5.0, 10.0, 'canyon', [(5, 0.55), (6.2, 0.95), (10, 1.25)], {}),            # Julie whistles, the rings tear apart
    (10.0, 17.5, 'canyon', [(10, 1.35), (12, 1.62), (17.5, 2.05)], {}),         # her message hops down to Léa and Tom
    (17.5, 25.0, 'signal', [(17.5, -0.5), (19.5, 0.3), (21.5, 1.2), (22.5, 1.7), (24, 2.0), (25, 2.1)], {'zoom': 1.45}),
    (25.0, 32.5, 'mesh', [(25, -0.3), (27, 0.3), (29, 1.2), (31.5, 2.2), (32.5, 2.35)], {'zoom': 1.15}),
    (32.5, 37.5, 'mesh', [(32.5, 2.6), (37.5, 3.1)], {'zoom': 1.3}),            # SOS
    (37.5, 42.5, 'signal', [(37.5, 2.1), (42.5, 2.1)], {'zoom': 1.45}),                     # under the feature montage
    (42.5, DUR, 'canyon', [(42.5, -1.0), (DUR, -0.75)], {}),                    # aerial view behind the end card
]

CLOCK = """(() => {
  let now = 0; const start = Date.now(); let q = [];
  performance.now = () => now;
  Date.now = () => start + now;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__advance = (ms) => { now += ms; const cbs = q; q = []; for (const cb of cbs) { try { cb(now); } catch (e) { console.error(e); } } };
})();"""

# Log what the acts emit, with the film time, for the sound effects.
HOOK = """() => {
  window.__events = [];
  for (const [name, a] of Object.entries(window.__kit.acts)) {
    for (const key of ['rings', 'waves', 'packets']) {
      const o = a[key]; if (!o) continue;
      const m = key === 'packets' ? 'send' : 'emit';
      const orig = o[m].bind(o);
      o[m] = (x, opts = {}) => {
        const c = opts.color; const color = c == null ? null : (typeof c === 'string' ? c : '#' + c.getHexString());
        window.__events.push({ t: window.__t, act: name, kind: key, color, size: opts.size || null, broken: !!opts.brokenFrom });
        return orig(x, opts);
      };
    }
  }
  ScrollTrigger.getAll().forEach((t) => t.disable(false));
}"""

STEP = """([act, s, first, o, t]) => {
  window.__t = t;
  const B = window.__kit, a = B.acts[act], m = a.marks;
  const i = Math.max(0, Math.min(m.length - 2, Math.floor(s)));
  const pr = m[i] + (s - i) * (m[i + 1] - m[i]);
  if (B.stage.active !== a) B.stage.setActive(act);
  if (first && o.restart) a.t0 = performance.now() - (o.restartAt || 0);
  a.camera.zoom = o.zoom || 1;
  a.camera.updateProjectionMatrix();
  a.setProgress(pr);
  window.__film.frame(t);
  window.__advance(1000 / 30);
}"""


def coord(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, s0), (t1, s1) in zip(keys, keys[1:]):
        if t <= t1:
            x = (t - t0) / (t1 - t0)
            return s0 + (s1 - s0) * x * x * (3 - 2 * x)
    return keys[-1][1]


def shot_at(t):
    for sh in SHOTS:
        if sh[0] <= t < sh[1]: return sh
    return SHOTS[-1]


async def main():
    flags = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '1') for a in sys.argv[1:] if a.startswith('--'))
    lang = flags.get('lang', 'fr')
    t_from, t_to = float(flags.get('from', 0)), float(flags.get('to', DUR))
    stills = [float(x) for x in flags['still'].split(',')] if 'still' in flags else None
    out = HERE / 'out'; out.mkdir(exist_ok=True)
    frames = pathlib.Path(flags.get('frames', f'/tmp/siflo-frames-{lang}'))
    shutil.rmtree(frames, ignore_errors=True); frames.mkdir(parents=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.add_init_script(CLOCK)
        await pg.goto(flags.get('url', 'http://127.0.0.1:8792/') + f'?capture&lang={lang}', wait_until='load')
        for _ in range(8000):  # the loader runs on the virtual clock
            await pg.evaluate('window.__advance && window.__advance(16)')
            if await pg.evaluate("!!window.__kit && document.getElementById('loader').classList.contains('done')"):
                break
            await pg.wait_for_timeout(15)
        await pg.add_style_tag(path=str(HERE / 'film.css'))
        await pg.add_script_tag(path=str(HERE / 'film.js'))
        await pg.evaluate(HOOK)
        await pg.evaluate("Promise.all([...document.querySelectorAll('#film img')].map((i) => i.decode().catch(() => {})))")
        await pg.wait_for_timeout(800)
        n_total = round(DUR * FPS)
        todo = {round(x * FPS) for x in stills} if stills else set(range(round(t_from * FPS), min(n_total, round(t_to * FPS))))
        n, prev = 0, None
        # Acts are stateful (schedules, packets in flight): every frame is stepped from the start,
        # only the requested ones are saved.
        for f in range(max(todo) + 1):
            t = f / FPS
            sh = shot_at(t)
            await pg.evaluate(STEP, [sh[2], coord(sh[3], t), sh is not prev, sh[4], t])
            prev = sh
            if f in todo:
                await pg.screenshot(path=str(frames / (f'still-{t:05.2f}.png' if stills else f'f{n:05d}.png')))
                n += 1
            if f % 150 == 0:
                print(f't={t:5.1f}s {sh[2]}', flush=True)
        events = await pg.evaluate('window.__events')
        await b.close()
    print('\n'.join(logs[:20]))
    if stills:
        for f in sorted(frames.glob('still-*.png')):
            shutil.copy(f, out / f'{lang}-{f.name}')
        print('stills in', out)
        return
    name = f'clean-{lang}' if (t_from, t_to) == (0, DUR) else f'part-{lang}-{t_from:g}-{t_to:g}'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(frames / 'f%05d.png'),
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', str(out / f'{name}.mp4')], check=True)
    if name.startswith('clean'):
        (out / f'events-{lang}.json').write_text(json.dumps(events))
    print(out / f'{name}.mp4', n, 'frames', len(events), 'events')

asyncio.run(main())
