#!/usr/bin/env python3
"""Synthesises the sound library into public/sfx/*.wav and public/music/*.wav.

Everything is generated from math (no samples, no licences). Re-run after edits:
  .venv-tts/bin/python scripts/sfx.py

SFX:   whoosh, whoosh_fast, tick, pop, impact, riser, glitch, chime, swell, thud, beep
Music: tension (92 bpm, D minor pulse), wonder (100 bpm, bright arps), dark (70 bpm drone + heartbeat)
"""
import pathlib
import wave

import numpy as np

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)


# ---------- helpers ----------
def t(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a, r, curve=3.0):
    """attack/release envelope over n samples, a/r in seconds"""
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na) ** 2
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


def onepole_lp(x, cutoff):
    """time-varying one-pole lowpass; cutoff Hz scalar or array"""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def bandpass(x, center, q=1.2):
    """state-variable bandpass with time-varying center"""
    c = np.broadcast_to(np.asarray(center, dtype=float), x.shape)
    y = np.empty_like(x)
    low = band = 0.0
    damp = 1 / q
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(c[i], SR / 6) / SR)
        high = x[i] - low - damp * band
        band += f * high
        low += f * band
        y[i] = band
    return y


def pink(n):
    w = rng.standard_normal(n)
    spec = np.fft.rfft(w)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[1:] /= np.sqrt(f[1:])
    p = np.fft.irfft(spec, n)
    return p / np.max(np.abs(p))


def reverb(x, sec=2.2, mix=0.25, damp=3000):
    n = int(sec * SR)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = onepole_lp(ir, damp)
    ir /= np.sqrt(np.sum(ir**2))
    L = len(x) + n
    wet = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
    return (1 - mix) * x + mix * wet * 0.6


def sat(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


def norm(x, peak_db=-1.0):
    return x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)


def write(path, x, stereo_width=0.0):
    path.parent.mkdir(parents=True, exist_ok=True)
    if stereo_width:
        d = int(0.012 * SR)
        r = np.concatenate([np.zeros(d), x[:-d]])
        st = np.stack([x, (1 - stereo_width) * x + stereo_width * r], 1)
    else:
        st = np.stack([x, x], 1)
    data = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def osc_saw(freq, tt):
    ph = np.cumsum(np.broadcast_to(freq, tt.shape) / SR)
    return 2 * (ph % 1) - 1


# ---------- SFX ----------
def whoosh(dur=0.8):
    n = int(dur * SR)
    x = pink(n)
    k = np.linspace(0, 1, n)
    center = 300 + 3500 * np.sin(np.pi * k) ** 2
    y = bandpass(x, center, q=1.6) * env(n, dur * 0.45, dur * 0.5, 2)
    return norm(reverb(y, 1.2, 0.2), -3)


def tick():
    n = int(0.05 * SR)
    tt = t(0.05)
    y = np.sin(2 * np.pi * 2600 * tt) * np.exp(-tt * 140) + 0.3 * rng.standard_normal(n) * np.exp(-tt * 400)
    return norm(y, -6)


def pop():
    tt = t(0.14)
    f = 900 * np.exp(-tt * 25) + 260
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30)
    return norm(y, -4)


def impact():
    tt = t(2.2)
    f = 62 * np.exp(-tt * 1.6) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.9)
    crack = onepole_lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 18) * 1.6
    y = sat(sub * 1.4 + crack, 2.2)
    return norm(reverb(y, 2.5, 0.3, 1800), -1)


def thud():
    tt = t(0.5)
    f = 110 * np.exp(-tt * 12) + 45
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
    return norm(sat(y, 1.8), -2)


def riser(dur=2.0):
    n = int(dur * SR)
    tt = t(dur)
    k = tt / dur
    noise = bandpass(pink(n), 400 + 6000 * k**2, q=1.0)
    tone = osc_saw(150 + 900 * k**2.2, tt) * 0.25
    y = (noise + onepole_lp(tone, 800 + 5000 * k)) * (k**2.2)
    y *= env(n, 0.01, 0.03)
    return norm(reverb(y, 1.5, 0.25), -3)


def glitch():
    n = int(0.3 * SR)
    y = np.zeros(n)
    pos = 0
    while pos < n:
        ln = int(rng.uniform(0.01, 0.04) * SR)
        f = rng.choice([180, 440, 1200, 2400, 90])
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(ln) / SR)) * rng.uniform(0.3, 1)
        if rng.random() < 0.4:
            seg = rng.standard_normal(ln) * 0.7
        y[pos : pos + ln] = seg[: max(0, min(ln, n - pos))]
        pos += ln + int(rng.uniform(0, 0.015) * SR)
    y = np.round(y * 6) / 6
    return norm(y * env(n, 0.002, 0.05), -6)


def chime():
    tt = t(2.5)
    y = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(1046.5, 1, 2.2), (1568, 0.5, 3), (2093, 0.35, 4), (2637, 0.2, 5)])
    return norm(reverb(y * env(len(tt), 0.003, 0.4), 2.5, 0.35), -6)


def swell(dur=1.6):
    n = int(dur * SR)
    tt = t(dur)
    chord = sum(osc_saw(f * (1 + 0.003 * i), tt) for i, f in enumerate([146.8, 220, 293.7, 349.2]))
    y = onepole_lp(chord, 300 + 2500 * (tt / dur) ** 2) * (tt / dur) ** 2
    return norm(reverb(y, 2, 0.4), -4)


def beep():
    tt = t(0.12)
    y = np.sin(2 * np.pi * 1760 * tt) * env(len(tt), 0.003, 0.03)
    return norm(y, -8)


# ---------- music ----------
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


def pad(chords, bpm, bars_per_chord, total, cutoff=900):
    beat = 60 / bpm
    out = np.zeros(int(total * SR))
    seg = bars_per_chord * 4 * beat
    i = 0
    while i * seg < total:
        notes = chords[i % len(chords)]
        tt = t(seg + 1.5)
        s = sum(osc_saw(NOTE(m) * (1 + d), tt) for m in notes for d in (-0.004, 0.004))
        s = onepole_lp(s, cutoff) * env(len(tt), 0.8, 1.6, 2)
        a = int(i * seg * SR)
        b = min(len(out), a + len(s))
        out[a:b] += s[: b - a]
        i += 1
    return out


def pulse_bass(pattern, bpm, total, cutoff=500, eighths=True):
    step = 60 / bpm / (2 if eighths else 1)
    out = np.zeros(int(total * SR))
    k = 0
    while k * step < total:
        m = pattern[k % len(pattern)]
        tt = t(step * 0.95)
        if m is not None:
            s = osc_saw(NOTE(m), tt) + 0.5 * np.sin(2 * np.pi * NOTE(m - 12) * tt)
            s = onepole_lp(s, cutoff * (1 + 2 * np.exp(-tt * 25))) * env(len(tt), 0.004, step * 0.5, 2)
            a = int(k * step * SR)
            b = min(len(out), a + len(s))
            out[a:b] += s[: b - a]
        k += 1
    return out


def hats(bpm, total, every=2, level=0.12):
    step = 60 / bpm / 2
    out = np.zeros(int(total * SR))
    n = int(0.04 * SR)
    h = onepole_lp(rng.standard_normal(n), 9000) - onepole_lp(rng.standard_normal(n), 3000)
    h *= np.exp(-np.arange(n) / SR * 90)
    k = 0
    while k * step < total:
        if k % every == every - 1:
            a = int(k * step * SR)
            b = min(len(out), a + n)
            out[a:b] += h[: b - a] * level * (1.3 if k % 4 == 3 else 1)
        k += 1
    return out


def kick(bpm, total, pattern=(1, 0, 0, 0), level=0.8):
    step = 60 / bpm
    out = np.zeros(int(total * SR))
    tt = t(0.4)
    kk = np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 9)
    k = 0
    while k * step < total:
        if pattern[k % len(pattern)]:
            a = int(k * step * SR)
            b = min(len(out), a + len(kk))
            out[a:b] += kk[: b - a] * level
        k += 1
    return out


def arp(chords, bpm, total, octave=12, level=0.25):
    step = 60 / bpm / 4
    out = np.zeros(int(total * SR))
    seg_steps = 16 * 2
    k = 0
    while k * step < total:
        notes = chords[(k // seg_steps) % len(chords)]
        m = notes[k % len(notes)] + octave + (12 if k % 8 >= 6 else 0)
        tt = t(step * 2)
        s = (np.sin(2 * np.pi * NOTE(m) * tt) + 0.3 * np.sin(4 * np.pi * NOTE(m) * tt)) * np.exp(-tt * 14)
        a = int(k * step * SR)
        b = min(len(out), a + len(s))
        out[a:b] += s[: b - a] * level
        k += 1
    return out


def master(x):
    x = reverb(x, 2.4, 0.22, 2500)
    x = sat(norm(x, -3) * 1.2, 1.3)
    n = len(x)
    return norm(x * env(n, 0.05, 1.5, 1.5), -3)


def music_tension(total=75):
    bpm = 92
    dm, bb, f, c = [50, 53, 57], [46, 50, 53], [41, 45, 48], [48, 52, 55]
    x = 0.55 * pad([dm, bb, f, c], bpm, 2, total, 700)
    x += 0.5 * pulse_bass([38, 38, 38, 38, 38, 38, 41, 40], bpm, total, 420)
    x += kick(bpm, total, (1, 0, 0, 0, 1, 0, 0, 1), 0.7)
    x += hats(bpm, total, 2, 0.18)
    return master(x)


def music_wonder(total=75):
    bpm = 100
    chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]]
    x = 0.45 * pad(chords, bpm, 2, total, 1400)
    x += arp(chords, bpm, total, 12, 0.28)
    x += 0.35 * pulse_bass([48, None, 48, None, 45, None, 43, None], bpm, total, 600)
    x += kick(bpm, total, (1, 0, 1, 0), 0.45)
    x += hats(bpm, total, 1, 0.07)
    return master(x)


def music_dark(total=75):
    bpm = 70
    x = 0.7 * pad([[38, 45, 50], [37, 44, 49]], bpm, 4, total, 380)
    beat = 60 / bpm
    tt = t(0.25)
    hb = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 18)
    out = np.zeros(len(x))
    k = 0
    while k * beat < total:
        for off, lv in ((0, 1), (0.22, 0.7)):
            a = int((k * beat + off) * SR)
            b = min(len(out), a + len(hb))
            if a < len(out):
                out[a:b] += hb[: b - a] * lv
        k += 1
    x += 0.9 * out + 0.06 * onepole_lp(pink(len(x)), 1200)
    return master(x)


def main():
    sfx = {
        "whoosh": whoosh(0.8),
        "whoosh_fast": whoosh(0.4),
        "tick": tick(),
        "pop": pop(),
        "impact": impact(),
        "thud": thud(),
        "riser": riser(2.0),
        "glitch": glitch(),
        "chime": chime(),
        "swell": swell(1.6),
        "beep": beep(),
    }
    for name, x in sfx.items():
        write(ROOT / "public" / "sfx" / f"{name}.wav", x, 0.3)
        print("sfx", name, f"{len(x) / SR:.2f}s")
    for name, fn in {"tension": music_tension, "wonder": music_wonder, "dark": music_dark}.items():
        write(ROOT / "public" / "music" / f"{name}.wav", fn(), 0.5)
        print("music", name)


if __name__ == "__main__":
    main()
