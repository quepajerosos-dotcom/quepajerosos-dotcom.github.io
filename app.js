const playBtn = document.getElementById("play");
const playLabel = document.getElementById("playLabel");
const prog = document.getElementById("prog");
const canvas = document.getElementById("viz");
const mini = document.getElementById("mini");
const ctx2 = canvas.getContext("2d");
const mctx = mini.getContext("2d");
const LOOP = 15484;

let audioCtx, src, gain, analyser, buffer, playing = false, started = 0;
const bins = { freq: null, wave: null };

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener("resize", resize);

async function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  const res = await fetch("./audio/pulse.wav");
  buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.35;
  bins.freq = new Uint8Array(analyser.frequencyBinCount);
  bins.wave = new Uint8Array(analyser.fftSize);
  gain = audioCtx.createGain();
  gain.gain.value = 0.72;
}

function avg(data, a, b) {
  let s = 0;
  for (let i = a; i < b; i++) s += data[i] || 0;
  return s / Math.max(1, b - a) / 255;
}

function strokeWave(g, wave, w, y, amp, color, lw) {
  const n = wave.length;
  if (!n) return;
  g.beginPath();
  const step = Math.max(1, Math.floor(n / Math.min(720, w)));
  for (let i = 0; i < n; i += step) {
    const x = (i / (n - 1)) * w;
    const v = ((wave[i] ?? 128) - 128) / 128;
    const cy = y + v * amp;
    i === 0 ? g.moveTo(x, cy) : g.lineTo(x, cy);
  }
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineJoin = "round";
  g.stroke();
}

function tick() {
  const w = innerWidth, h = innerHeight;
  ctx2.clearRect(0, 0, w, h);
  let bass = 0, mid = 0, energy = 0;
  if (playing && analyser) {
    analyser.getByteFrequencyData(bins.freq);
    analyser.getByteTimeDomainData(bins.wave);
    bass = avg(bins.freq, 1, 8);
    mid = avg(bins.freq, 16, 80);
    const high = avg(bins.freq, 120, 400);
    energy = bass * 0.55 + mid * 0.3 + high * 0.15;
    const root = document.documentElement;
    root.style.setProperty("--bass", bass.toFixed(3));
    root.style.setProperty("--mid", mid.toFixed(3));
    root.style.setProperty("--high", high.toFixed(3));
    root.style.setProperty("--energy", energy.toFixed(3));
    prog.style.width = (((Date.now() - started) % LOOP) / LOOP) * 100 + "%";

    const r = 140 + bass * 520;
    const glow = ctx2.createRadialGradient(w * 0.5, h * 0.52, 8, w * 0.5, h * 0.52, r);
    glow.addColorStop(0, `rgba(200,255,0,${0.16 + bass * 0.42})`);
    glow.addColorStop(1, "rgba(200,255,0,0)");
    ctx2.fillStyle = glow;
    ctx2.fillRect(0, 0, w, h);

    const y = h * 0.55;
    const amp = 70 + energy * 160;
    ctx2.shadowColor = "rgba(200,255,0,0.85)";
    ctx2.shadowBlur = 18 + energy * 28;
    strokeWave(ctx2, bins.wave, w, y, amp, "rgba(200,255,0,0.95)", 2.4);
    ctx2.shadowBlur = 0;
    strokeWave(ctx2, bins.wave, w, y, amp, "rgba(244,244,244,0.95)", 1.1);

    mctx.clearRect(0, 0, 160, 28);
    strokeWave(mctx, bins.wave, 160, 14, 11, "#c8ff00", 1.4);
  }
  requestAnimationFrame(tick);
}
tick();

playBtn.addEventListener("click", async () => {
  await ensureAudio();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  if (!playing) {
    src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(gain);
    gain.connect(analyser);
    analyser.connect(audioCtx.destination);
    src.start();
    playing = true;
    started = Date.now();
    playBtn.textContent = "❚❚";
    playBtn.setAttribute("aria-label", "Pausa");
    playLabel.textContent = "Pausa";
  } else {
    try { src.stop(); } catch {}
    playing = false;
    playBtn.textContent = "▶";
    playBtn.setAttribute("aria-label", "Reproducir");
    playLabel.textContent = "Play";
    ["bass", "mid", "high", "energy"].forEach((k) => document.documentElement.style.setProperty("--" + k, "0"));
  }
});
