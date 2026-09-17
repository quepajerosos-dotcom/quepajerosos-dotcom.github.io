const playBtn = document.getElementById("play");
const playLabel = document.getElementById("playLabel");
const prog = document.getElementById("prog");
const mini = document.getElementById("mini");
const mctx = mini.getContext("2d");
const LOOP = 15484;

let audioCtx, src, gain, analyser, buffer, playing = false, started = 0;
const wave = { data: null };

async function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  const res = await fetch("./audio/pulse.wav");
  buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.35;
  wave.data = new Uint8Array(analyser.fftSize);
  gain = audioCtx.createGain();
  gain.gain.value = 0.72;
}

function strokeWave(g, data, w, y, amp, color, lw) {
  const n = data.length;
  if (!n) return;
  g.beginPath();
  const step = Math.max(1, Math.floor(n / w));
  for (let i = 0; i < n; i += step) {
    const x = (i / (n - 1)) * w;
    const v = ((data[i] ?? 128) - 128) / 128;
    const cy = y + v * amp;
    i === 0 ? g.moveTo(x, cy) : g.lineTo(x, cy);
  }
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.stroke();
}

function tick() {
  if (playing && analyser) {
    analyser.getByteTimeDomainData(wave.data);
    prog.style.width = (((Date.now() - started) % LOOP) / LOOP) * 100 + "%";
    mctx.clearRect(0, 0, 160, 28);
    strokeWave(mctx, wave.data, 160, 14, 11, "#c8ff00", 1.4);
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
  }
});
