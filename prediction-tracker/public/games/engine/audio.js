// Procedural WebAudio SFX — no asset files. Call resumeAudio() on first user gesture.
let ctx = null, master = null;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function resumeAudio() { const c = ac(); if (c.state === 'suspended') c.resume(); }
export function setVolume(v) { ac(); master.gain.value = v; }

const now = () => ac().currentTime;

function tone(freq, t, dur, type = 'sine', gain = 0.4, slideTo = null) {
  const c = ac();
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.03);
}

function noise(t, dur, gain = 0.4, freq = 1200, type = 'bandpass') {
  const c = ac();
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur);
}

export const sfx = {
  laser() { tone(900, now(), 0.12, 'square', 0.12, 240); },
  beam() { tone(620, now(), 0.16, 'sawtooth', 0.1, 1500); },
  hit() { noise(now(), 0.16, 0.25, 700); tone(130, now(), 0.16, 'sawtooth', 0.2, 60); },
  freeze() { tone(280, now(), 0.45, 'triangle', 0.2, 1500); noise(now() + 0.02, 0.3, 0.12, 3200, 'highpass'); },
  boost() { tone(150, now(), 0.28, 'sawtooth', 0.18, 540); },
  thrust() { noise(now(), 0.07, 0.05, 480); },
  kill() { tone(220, now(), 0.55, 'sawtooth', 0.28, 38); noise(now(), 0.5, 0.25, 380); },
  order() { tone(520, now(), 0.08, 'square', 0.1); tone(780, now() + 0.05, 0.08, 'square', 0.08); },
  win() { const t = now(); [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.26, 'square', 0.16)); },
  lose() { const t = now(); [392, 311, 233].forEach((f, i) => tone(f, t + i * 0.15, 0.32, 'sawtooth', 0.18, f * 0.7)); },
  blip() { tone(680, now(), 0.05, 'square', 0.1); },
};
