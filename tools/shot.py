"""Screenshots of the page with the local Chrome on the real GPU.
Usage: shot.py out_prefix act s1 s2 ... [--ui] [--w=1440 --h=900] [--url=http://127.0.0.1:8792/] [--lang=fr] [--wait=2500]
s = panel coordinate of the act (0 = first card centred, 1 = second card…). Without --ui the page
text is hidden and the act is forced to that position; with --ui the page is scrolled there.
act may also be a CSS selector of a plain section (e.g. '#film'), shot with --ui."""
import asyncio, sys
from playwright.async_api import async_playwright

async def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '1') for a in sys.argv[1:] if a.startswith('--'))
    prefix, act, *ps = args
    w, h = int(flags.get('w', 1440)), int(flags.get('h', 900))
    mobile = w < 700
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile,
                                  user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36' if mobile else None)
        pg = await ctx.new_page()
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto(flags.get('url', 'http://127.0.0.1:8792/') + f"?debug&lang={flags.get('lang', 'fr')}", wait_until='load')
        await pg.wait_for_function("window.__kit && document.getElementById('loader').classList.contains('done')", timeout=120000)
        await pg.wait_for_timeout(1800)
        if 'ui' not in flags:
            await pg.add_style_tag(content='main,.topnav,.footer,.grain,.scroll-progress{visibility:hidden!important}')
        for i, s in enumerate(ps):
            if act.startswith('#'):
                await pg.evaluate(f"(() => {{ const el = document.querySelector('{act}'); const y = el.offsetTop + {float(s)} * el.offsetHeight; __kit.lenis ? __kit.lenis.scrollTo(y, {{ immediate: true, force: true }}) : scrollTo(0, y); }})()")
            else:
                await pg.evaluate(f"""(() => {{
                  const B = window.__kit, a = B.acts['{act}'], m = a.marks, s = {float(s)};
                  const i = Math.max(0, Math.min(m.length - 2, Math.floor(s)));
                  const pr = m[i] + (s - i) * (m[i + 1] - m[i]);
                  const sec = document.querySelector('section[data-act="{act}"]');
                  const y = sec.offsetTop + pr * (sec.offsetHeight - innerHeight);
                  if ({'true' if 'ui' in flags else 'false'}) {{ B.lenis ? B.lenis.scrollTo(y, {{ immediate: true, force: true }}) : scrollTo(0, y); }}
                  else {{ ScrollTrigger.getAll().forEach(t => t.disable(false)); B.stage.setActive('{act}'); a.setProgress(pr); }}
                }})()""")
            await pg.wait_for_timeout(int(flags.get('wait', 2500)))
            await pg.screenshot(path=f'{prefix}-{i:02d}.png')
        print('\n'.join(logs[:30]))
        await b.close()
asyncio.run(main())
