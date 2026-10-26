(function () {
  "use strict";

  const hero = document.getElementById("1243667655");
  if (!hero) return;

  const source =
    "assets/content/vid.cdn-website.com/19ecbe2b/videos/" +
    "IqH3YI2YSkyk3XKHf2Vm_solidkit_top-v.mp4";
  const poster =
    "assets/content/lirp.cdn-website.com/19ecbe2b/dms3rep/multi/opt/" +
    "IqH3YI2YSkyk3XKHf2Vm_solidkit_top.v2.0000000-1920w.jpg";

  function ensureVideo() {
    let wrapper = hero.querySelector(".videobgwrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "videobgwrapper video-ssr";
      wrapper.dataset.ratio = "0.5625";
      hero.prepend(wrapper);
    }

    let video = wrapper.querySelector("video");
    if (!video) {
      video = document.createElement("video");
      video.className = "videobgframe";
      video.id = "videobgframe-1243667655";
      video.style.objectPosition = "50% 50%";
      wrapper.append(video);
    }

    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.poster = poster;
    if (video.getAttribute("src") !== source) video.src = source;

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // The poster remains visible if a browser blocks background autoplay.
      });
    }
  }

  ensureVideo();
  window.addEventListener("load", ensureVideo, { once: true });

  // The legacy Duda runtime can remove its server-rendered video after startup.
  // Restore the local video if that late cleanup runs.
  new MutationObserver(() => {
    if (!hero.querySelector(".videobgwrapper video")) ensureVideo();
  }).observe(hero, { childList: true, subtree: true });
})();
