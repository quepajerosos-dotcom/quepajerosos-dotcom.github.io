const VIDEO_ID = "y2SuK7EAEqY";
const playBtn = document.getElementById("play");
let player = null;
let playing = false;
let pending = false;

function setUi(on) {
  playing = on;
  playBtn.textContent = on ? "❚❚" : "▶";
  playBtn.setAttribute("aria-label", on ? "Pausa" : "Reproducir");
}

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("yt-bg", {
    videoId: VIDEO_ID,
    width: 1,
    height: 1,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      loop: 1,
      playlist: VIDEO_ID,
    },
    events: {
      onReady: () => {
        if (pending) player.playVideo();
      },
      onStateChange: (e) => setUi(e.data === 1),
    },
  });
};

if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

playBtn.addEventListener("click", () => {
  if (!player || typeof player.playVideo !== "function") {
    pending = !pending;
    setUi(pending);
    return;
  }
  if (playing) player.pauseVideo();
  else player.playVideo();
});

const verBtn = document.getElementById("ver-servicios");
const planes = document.getElementById("planes");
function openPlanes() {
  if (!planes) return;
  planes.hidden = false;
  if (verBtn) verBtn.hidden = true;
}
if (verBtn) verBtn.addEventListener("click", openPlanes);
if (location.hash === "#servicios") openPlanes();
window.addEventListener("hashchange", () => {
  if (location.hash === "#servicios") openPlanes();
});
