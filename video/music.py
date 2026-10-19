"""Soundtrack of the Siflo film (48 s): an adventure score in D minor, 96 BPM (one bar = 2.5 s,
one scene cut per bar line), plus the sound of the scenes: wind and waterfall in the gorge, the
whistle drowned by the water, phone taps, vibrations, acknowledgements and the SOS. The effects
are placed on the events logged by render.py, so they land on the frame where the 3D shows them.
Everything is synthesised here: no samples, no licence.

    uv run --with numpy --with scipy python video/music.py fr    # video/out/music-fr.wav (events-fr.json)
"""
import json, pathlib, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = pathlib.Path(__file__).parent
SR = 48000
DUR = 48.0
N = int(SR * DUR)
BEAT = 60 / 96
BAR = 4 * BEAT
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)          # dry music
FX_L = np.zeros(N); FX_R = np.zeros(N)    # effects (own reverb send)

# Scene cuts (same as film.js): intro, whistle, relay, signal, mesh, SOS, montage, end.
CUT = [0, 5, 10, 17.5, 25, 32.5, 37.5, 42.5]


def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def idx(t): return int(round(t * SR))
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)


def add(buf_l, buf_r, t, x, gain=1.0, pan=0.0):
    i = idx(t)
    if i >= N or i + len(x) <= 0: return
    j0 = max(0, -i); x = x[j0:]; i = max(0, i)
    n = min(len(x), N - i)
    buf_l[i:i + n] += x[:n] * gain * np.sqrt(0.5 * (1 - pan))
    buf_r[i:i + n] += x[:n] * gain * np.sqrt(0.5 * (1 + pan))


def env(n, a, d, s, r):
    e = np.full(n, s, dtype=float)
    A, D, Rr = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n); e[:A] = np.linspace(0, 1, A, endpoint=False) if A else e[:A]
    D = min(D, n - A); e[A:A + D] = np.linspace(1, s, D)
    if 0 < Rr < n: e[-Rr:] *= np.linspace(1, 0, Rr)
    return e


def saw(f, n, ph=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n); k = 1
    while k * f < 12000 and k < 60:
        out += np.sin(2 * np.pi * k * f * t + ph * k) / k; k += 1
    return out * 0.6


def curve(points, n0, n1):
    """Piecewise-linear automation (time s, value) sampled on [n0, n1)."""
    ts, vs = zip(*points)
    return np.interp(np.arange(n0, n1) / SR, ts, vs)


# ---------- harmony: i – VI – III – VII, one chord per bar ----------
D = 50  # D3
PROG = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'F': [53, 57, 60], 'C': [48, 52, 55], 'Gm': [43, 50, 55], 'A': [45, 49, 52]}
BARS = ['Dm', 'Dm', 'Dm', 'Bb', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Dm', 'Dm']
def chord_at(t): return PROG[BARS[min(len(BARS) - 1, int(t // BAR))]]


# ---------- instruments ----------
def pad(t0, t1, notes, gain, bright=1200, att=1.2):
    n = idx(t1) - idx(t0)
    x = np.zeros(n)
    for m in notes:
        for det in (-0.08, 0.0, 0.07):
            x += saw(mtof(m + det), n, rng.uniform(0, 6))
    x = lp(x, bright, 2) * env(n, att, 0.3, 1.0, min(1.0, (t1 - t0) * 0.4))
    add(L, R, t0, x / len(notes), gain, -0.3)
    add(L, R, t0 + 0.012, x / len(notes), gain, 0.3)


def brass(t0, t1, notes, gain):
    n = idx(t1) - idx(t0)
    tt = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        for det in (-0.05, 0.05):
            x += saw(mtof(m + det), n)
    cut = 300 + 2600 * (1 - np.exp(-tt / 0.6))  # the filter opens like a horn swell
    y = np.zeros(n); blk = 2048
    for s in range(0, n, blk):
        y[s:s + blk] = lp(x[max(0, s - 512):s + blk], float(cut[s]), 2)[-len(x[s:s + blk]):]
    y *= env(n, 0.35, 0.4, 0.85, 0.6)
    add(L, R, t0, y / len(notes), gain, -0.15)
    add(L, R, t0 + 0.008, y / len(notes), gain, 0.15)


def pluck(t, m, gain, pan=0.0, dur=0.28, bright=2600):
    n = idx(dur)
    x = saw(mtof(m), n) + 0.5 * saw(mtof(m + 12.04), n)
    tt = np.arange(n) / SR
    y = lp(x, bright, 2) * np.exp(-tt / (dur * 0.35))
    add(L, R, t, y, gain, pan)


def bell(t, m, gain, pan=0.0, dur=2.2):
    n = idx(dur); tt = np.arange(n) / SR; f = mtof(m)
    y = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * d) for r, a, d in ((1, 1, 1.6), (2.76, 0.4, 3.5), (5.4, 0.18, 6), (8.9, 0.08, 9)))
    y *= np.minimum(1, tt / 0.004)
    add(L, R, t, y, gain, pan)


def taiko(t, gain, f0=78, pan=0.0):
    n = idx(1.4); tt = np.arange(n) / SR
    f = f0 * (1 + 0.9 * np.exp(-tt * 28))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4.2)
    skin = lp(rng.standard_normal(n), 900) * np.exp(-tt * 30) * 0.6
    add(L, R, t, np.tanh(1.6 * (body + skin)), gain, pan)


def tom(t, gain, f0=120, pan=0.0):
    n = idx(0.6); tt = np.arange(n) / SR
    f = f0 * (1 + 0.5 * np.exp(-tt * 35))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) + bp(rng.standard_normal(n), 300, 2500) * np.exp(-tt * 40) * 0.3
    add(L, R, t, y, gain, pan)


def kick(t, gain):
    n = idx(0.5); tt = np.arange(n) / SR
    f = 46 * (1 + 2.2 * np.exp(-tt * 40))
    add(L, R, t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7), gain)


def shaker(t, gain, pan=0.0):
    n = idx(0.09); tt = np.arange(n) / SR
    add(L, R, t, hp(rng.standard_normal(n), 6000) * np.exp(-tt * 55), gain, pan)


def clap(t, gain):
    n = idx(0.35); tt = np.arange(n) / SR
    e = sum(np.exp(-np.maximum(0, tt - d) * 60) * (tt >= d) for d in (0, 0.011, 0.023)) + np.exp(-tt * 14) * 0.4
    add(L, R, t, bp(rng.standard_normal(n), 900, 5000) * e, gain)


def riser(t1, length, gain):
    n = idx(length); tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    y = np.zeros(n); blk = 2048
    for s in range(0, n, blk):
        fc = 400 + 7000 * (s / n) ** 2
        y[s:s + blk] = bp(x[max(0, s - 512):s + blk], fc * 0.7, min(fc * 1.4, 20000), 2)[-len(x[s:s + blk]):]
    y *= (tt / length) ** 2.2
    add(L, R, t1 - length, y, gain, -0.4); add(L, R, t1 - length, y[::-1][::-1] * 0.9, gain, 0.4)


def boom(t, gain):
    n = idx(3.0); tt = np.arange(n) / SR
    f = 38 * (1 + 1.5 * np.exp(-tt * 9))
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    crash = hp(rng.standard_normal(n), 3500) * np.exp(-tt * 2.2) * 0.25
    add(L, R, t, np.tanh(1.3 * sub) + crash, gain)


# ---------- sound effects ----------
def noise_bed(color_lp, n):
    return lp(rng.standard_normal(n), color_lp, 1)


def ambience():
    # Waterfall: a low roar loudest in the whistle scene, wind on the open shots.
    n0, n1 = 0, idx(17.5)
    roar = noise_bed(700, n1 - n0) * 0.5 + bp(rng.standard_normal(n1 - n0), 900, 3200) * 0.18
    roar *= 1 + 0.12 * np.sin(2 * np.pi * 0.31 * np.arange(n1 - n0) / SR)
    lvl = curve([(0, 0), (1.5, 0.25), (4.6, 0.45), (5.0, 1.0), (9.6, 1.0), (10.2, 0.35), (16.8, 0.25), (17.5, 0)], n0, n1)
    add(FX_L, FX_R, 0, roar * lvl, 0.55, -0.2)
    add(FX_L, FX_R, 0.02, roar[::-1] * lvl, 0.5, 0.25)
    for t0, t1, g in ((0, 5.2, 0.35), (42.5, 48, 0.3), (25, 37.5, 0.08)):
        n = idx(t1) - idx(t0); tt = np.arange(n) / SR
        w = np.zeros(n); x = rng.standard_normal(n); blk = 4096
        for s in range(0, n, blk):
            fc = 500 + 380 * np.sin(2 * np.pi * 0.17 * s / SR + t0)
            w[s:s + blk] = bp(x[max(0, s - 1024):s + blk], fc * 0.6, fc * 1.6)[-len(x[s:s + blk]):]
        w *= env(n, 1.2, 0, 1, 1.4)
        add(FX_L, FX_R, t0, w, g, 0.5); add(FX_L, FX_R, t0, w[::-1], g * 0.8, -0.5)


def whistle(t, gain, dur=0.42, drowned=False, pan=0.0):
    n = idx(dur); tt = np.arange(n) / SR
    f = 2950 * (1 + 0.012 * np.sin(2 * np.pi * 34 * tt))     # the pea's flutter
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    breath = bp(rng.standard_normal(n), 2000, 6000) * 0.25
    y = (tone + breath) * env(n, 0.015, 0.05, 0.85, 0.06)
    if drowned:
        y = lp(y, 2400, 2) * (0.6 + 0.4 * rng.random(n) ** 0.5)
    add(FX_L, FX_R, t, y, gain, pan)


def buzz(t, gain, dur=0.38):
    n = idx(dur); tt = np.arange(n) / SR
    y = np.sign(np.sin(2 * np.pi * 172 * tt)) * 0.5 + np.sin(2 * np.pi * 344 * tt) * 0.3
    y = lp(y, 900) * env(n, 0.01, 0, 1, 0.04) * (0.75 + 0.25 * np.sin(2 * np.pi * 9 * tt))
    add(FX_L, FX_R, t, y, gain, 0.25)


def tap(t, gain):
    n = idx(0.06); tt = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 1500, 6000) * np.exp(-tt * 120) + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 70) * 0.5
    add(FX_L, FX_R, t, y, gain, -0.2)


def blip(t, gain, f=1500, pan=0.0):
    n = idx(0.12); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * tt * (1 + 0.25 * tt / 0.12)) * np.exp(-tt * 38)
    add(FX_L, FX_R, t, y, gain, pan)


def chime(t, gain, pan=0.0):
    for k, m in enumerate((88, 93)):
        n = idx(0.7); tt = np.arange(n) / SR
        y = np.sin(2 * np.pi * mtof(m) * tt) * np.exp(-tt * 6) + 0.2 * np.sin(2 * np.pi * mtof(m) * 3 * tt) * np.exp(-tt * 12)
        add(FX_L, FX_R, t + k * 0.075, y * np.minimum(1, tt / 0.003), gain, pan)


def sos_pulse(t, gain):
    for k, f in enumerate((988, 740, 988)):
        n = idx(0.16); tt = np.arange(n) / SR
        y = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * env(n, 0.006, 0, 1, 0.03)
        add(FX_L, FX_R, t + k * 0.19, y, gain, 0.0)


def whoosh(t, gain, length=0.5):
    n = idx(length); tt = np.arange(n) / SR
    x = rng.standard_normal(n); y = np.zeros(n); blk = 1024
    for s in range(0, n, blk):
        fc = 600 + 3500 * np.sin(np.pi * s / n)
        y[s:s + blk] = bp(x[max(0, s - 256):s + blk], fc * 0.6, fc * 1.5)[-len(x[s:s + blk]):]
    add(FX_L, FX_R, t, y * np.sin(np.pi * tt / length) ** 2, gain, 0.3)


# ---------- the score ----------
def score():
    # Intro (0–5): a drone and a slow horn call over the wind; distant taiko.
    pad(0, 5.4, [38, 45, 50], 0.22, bright=600, att=2.5)
    brass(1.25, 4.9, [62, 69], 0.12)
    for t in (0.0, 2.5, 3.75): taiko(t, 0.35 if t else 0.5, 70)
    riser(5.0, 1.8, 0.10)
    # Whistle (5–10): music recedes behind the roar, a low tremolo holds the tension.
    n = idx(5.2); tt = np.arange(n) / SR
    trem = sum(saw(mtof(m), n) for m in (38, 45)) * (0.6 + 0.4 * np.sin(2 * np.pi * 12 * tt) ** 2)
    add(L, R, 5.0, lp(trem, 500) * env(n, 0.4, 0, 1, 0.6), 0.12)
    taiko(5.0, 0.7, 62); taiko(7.5, 0.45, 62)
    riser(10.0, 2.0, 0.12)
    # Relay (10–17.5): the theme starts. Pulse of plucked eighths, toms, the bell motif.
    for b in range(4, 7):
        t0 = b * BAR
        pad(t0, t0 + BAR + 0.3, chord_at(t0 + 0.01), 0.14, bright=1500)
    for k in range(int((17.5 - 10) / (BEAT / 2))):
        t = 10 + k * BEAT / 2
        ch = chord_at(t + 0.001)
        pluck(t, ch[0] + 12 * (k % 4 == 2) + 7 * (k % 4 == 3), 0.16 * (1.15 if k % 2 == 0 else 0.85), pan=(-0.3 if k % 2 else 0.3))
    for k in range(int(7.5 / BEAT)):
        t = 10 + k * BEAT
        if k % 4 == 0: taiko(t, 0.5, 70)
        if k % 4 == 2: tom(t, 0.35, 110)
        if k % 8 == 7: tom(t + BEAT / 2, 0.3, 140, 0.3)
    for t, m in ((10.0, 74), (10.625, 81), (11.25, 79), (11.875, 81), (12.5, 77), (13.75, 76), (15.0, 74), (15.625, 81), (16.25, 84), (16.875, 81)):
        bell(t, m, 0.07, pan=0.2)
    brass(15.0, 17.6, [57, 64], 0.10)
    riser(17.5, 1.5, 0.12)
    # Signal (17.5–25): tighter, kick on the beat, shaker sixteenths, room for the phone sounds.
    for b in range(7, 10):
        t0 = b * BAR
        pad(t0, t0 + BAR + 0.3, chord_at(t0 + 0.01), 0.10, bright=1000)
    for k in range(int(7.5 / (BEAT / 4))):
        t = 17.5 + k * BEAT / 4
        if k % 4 == 0: kick(t, 0.55)
        shaker(t, 0.05 if k % 2 else 0.08, pan=0.4)
        if k % 8 == 4: clap(t, 0.14)
        if k % 2 == 0: pluck(t, chord_at(t + 0.001)[k // 2 % 3] + 12, 0.07, pan=-0.35, dur=0.18, bright=3500)
    riser(25.0, 1.5, 0.12)
    # Mesh (25–32.5): full groove, arpeggio and brass chords, the theme on the bell.
    for b in range(10, 13):
        t0 = b * BAR
        ch = chord_at(t0 + 0.01)
        pad(t0, t0 + BAR + 0.3, ch, 0.13, bright=2200)
        brass(t0, t0 + BAR, [ch[0] + 12, ch[1] + 12], 0.07)
    for k in range(int(7.5 / (BEAT / 4))):
        t = 25 + k * BEAT / 4
        ch = chord_at(t + 0.001)
        pluck(t, ch[k % 3] + 24 - 12 * (k % 8 >= 4), 0.075, pan=(0.45 if k % 2 else -0.45), dur=0.2, bright=4000)
        if k % 8 == 0: taiko(t, 0.5, 70)
        if k % 8 == 4: tom(t, 0.3, 120)
        if k % 4 == 0: kick(t, 0.4)
        shaker(t, 0.04, pan=-0.4)
    for t, m in ((25.0, 74), (25.625, 81), (26.25, 79), (26.875, 81), (27.5, 82), (28.75, 81), (30.0, 77), (30.625, 79), (31.25, 81), (31.875, 84)):
        bell(t, m, 0.075, pan=-0.15)
    riser(32.5, 1.2, 0.10)
    # SOS (32.5–37.5): the groove stops; a heartbeat and a low pedal under the alarm.
    pad(32.5, 37.8, [38, 45, 49], 0.16, bright=700, att=0.3)
    for k in range(8):
        t = 32.5 + k * BEAT
        kick(t, 0.5); kick(t + 0.17, 0.3)
    riser(37.5, 2.4, 0.16)
    # Montage (37.5–42.5): the theme in full, brass and drums.
    for b, chn in ((15, 'Gm'), (16, 'A')):
        t0 = b * BAR
        pad(t0, t0 + BAR + 0.3, PROG[chn], 0.16, bright=2600)
        brass(t0, t0 + BAR, [m + 12 for m in PROG[chn][:2]], 0.10)
    for k in range(int(5 / (BEAT / 2))):
        t = 37.5 + k * BEAT / 2
        pluck(t, chord_at(t + 0.001)[0] + 12 * (k % 2), 0.12, pan=(0.3 if k % 2 else -0.3))
        if k % 4 == 0: taiko(t, 0.55, 72)
        if k % 4 == 2: tom(t, 0.35, 115)
        if k >= 12: tom(t, 0.22 + 0.03 * (k - 12), 150 + 10 * (k - 12), 0.2)
    for t, m in ((37.5, 74), (38.125, 81), (38.75, 79), (39.375, 81), (40.0, 85), (41.25, 88)):
        bell(t, m, 0.08)
    # End (42.5–48): final chord with a big hit, ringing out.
    boom(42.5, 0.55); taiko(42.5, 0.8, 60)
    pad(42.5, 48.0, [38, 50, 57, 62, 65], 0.2, bright=1800, att=0.05)
    brass(42.5, 47.5, [62, 69, 74], 0.12)
    bell(43.1, 86, 0.06); bell(43.6, 93, 0.05); bell(44.3, 98, 0.04)
    for t in CUT[1:-1]:
        boom(t, 0.18)


def effects(events):
    ambience()
    last = {}
    def every(key, t, gap):
        if t - last.get(key, -9) < gap: return False
        last[key] = t; return True
    green, red, white = '95d4a9', 'ff4b42', 'ffffff'
    for e in events:
        t, act, kind, c = e['t'], e['act'], e['kind'], (e['color'] or '').lower().lstrip('#')
        if t is None: continue
        if act == 'canyon' and kind == 'rings' and e['broken']:
            whistle(t, 0.22, drowned=True, pan=-0.3)
        elif act == 'canyon' and kind == 'rings':
            tap(t, 0.2); whoosh(t + 0.05, 0.08)
        elif act == 'canyon' and kind == 'packets':
            if c == green: chime(t + 0.8, 0.07, 0.2)
            elif every('cp', t, 0.25): blip(t + 0.6, 0.05, 1700, -0.2)
        elif act == 'signal' and kind == 'rings' and every('tap', t, 5):
            tap(t, 0.35)
        elif act == 'signal' and kind == 'waves':
            buzz(t, 0.16); whistle(t + 0.02, 0.12, dur=0.4, pan=0.3)
        elif act == 'signal' and kind == 'packets':
            if c == green: chime(t + 0.55, 0.09, -0.2)
            elif every('sp', t, 1.2): whoosh(t, 0.07, 0.6)
        elif act == 'mesh' and kind == 'packets' and every('mp', t, 0.35):
            blip(t + 0.5, 0.035 if c != green else 0.03, 1900 if c != green else 1300, rng.uniform(-0.5, 0.5))
        elif act == 'mesh' and kind == 'rings' and c == red:
            sos_pulse(t, 0.08)
        elif act == 'mesh' and kind == 'rings' and t > 28 and every('late', t, 1.5):
            chime(t, 0.05, 0.3)


def reverb(l, r, seconds, mix, seed):
    g = np.random.default_rng(seed)
    n = idx(seconds); tt = np.arange(n) / SR
    ir_l = g.standard_normal(n) * np.exp(-tt * 6.9 / seconds); ir_r = g.standard_normal(n) * np.exp(-tt * 6.9 / seconds)
    ir_l = lp(ir_l, 6000); ir_r = lp(ir_r, 6000)
    ir_l /= np.sqrt(np.sum(ir_l ** 2)); ir_r /= np.sqrt(np.sum(ir_r ** 2))
    wl = signal.fftconvolve(l, ir_l)[:N]; wr = signal.fftconvolve(r, ir_r)[:N]
    return l + mix * wl, r + mix * wr


def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else 'fr'
    events = json.loads((HERE / 'out' / f'events-{lang}.json').read_text())
    score()
    effects(events)
    ml, mr = reverb(hp(L, 45, 4), hp(R, 45, 4), 2.6, 0.35, 1)
    fl, fr = reverb(FX_L, FX_R, 1.4, 0.22, 2)
    out = np.stack([ml + fl, mr + fr], 1)
    fade = np.ones(N); fade[-idx(1.0):] = np.linspace(1, 0, idx(1.0)) ** 2
    out *= fade[:, None]
    out = np.tanh(out / np.max(np.abs(out)) * 1.6) / np.tanh(1.6) * 0.89  # gentle limiting, peak about −1 dB
    path = HERE / 'out' / f'music-{lang}.wav'
    wavfile.write(path, SR, (out * 32767).astype(np.int16))
    print(path)


main()
