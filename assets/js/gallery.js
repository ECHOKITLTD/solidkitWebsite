(function () {
  "use strict";

  const imagePattern = /"imgSrc":"([^"\\]*(?:\\.[^"\\]*)*)"/g;

  function decodeJsonString(value) {
    try {
      return JSON.parse(`"${value}"`);
    } catch (_) {
      return value;
    }
  }

  function imageSources(script) {
    const sources = [];
    let match;

    while ((match = imagePattern.exec(script.textContent || "")) !== null) {
      const source = decodeJsonString(match[1]);
      if (source && !sources.includes(source)) sources.push(source);
    }

    return sources;
  }

  function initialiseGallery(script, galleryNumber) {
    const wrapper =
      script.previousElementSibling?.matches('[data-auto="slider-wrapper"]')
        ? script.previousElementSibling
        : script.parentElement?.querySelector('[data-auto="slider-wrapper"]');
    const sources = imageSources(script);

    if (!wrapper || sources.length === 0) return;

    let currentIndex = 0;
    let autoAdvance;
    let touchStartX = null;
    const label = `Product gallery ${galleryNumber}`;

    wrapper.className = "solidkit-gallery";
    wrapper.removeAttribute("data-auto");
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", label);
    wrapper.innerHTML = "";

    const stage = document.createElement("div");
    stage.className = "solidkit-gallery__stage";

    const image = document.createElement("img");
    image.className = "solidkit-gallery__image";
    image.src = sources[0];
    image.alt = `Gallery image 1 of ${sources.length}`;
    image.decoding = "async";
    stage.append(image);
    wrapper.append(stage);

    if (sources.length === 1) return;

    const previous = document.createElement("button");
    previous.className = "solidkit-gallery__arrow solidkit-gallery__arrow--previous";
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous image");
    previous.textContent = "‹";

    const next = document.createElement("button");
    next.className = "solidkit-gallery__arrow solidkit-gallery__arrow--next";
    next.type = "button";
    next.setAttribute("aria-label", "Next image");
    next.textContent = "›";

    const dots = document.createElement("div");
    dots.className = "solidkit-gallery__dots";

    const dotButtons = sources.map((_, index) => {
      const dot = document.createElement("button");
      dot.className = "solidkit-gallery__dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Show image ${index + 1} of ${sources.length}`);
      dot.setAttribute("aria-current", index === 0 ? "true" : "false");
      dot.addEventListener("click", () => show(index, true));
      dots.append(dot);
      return dot;
    });

    function preload(index) {
      const preloadImage = new Image();
      preloadImage.src = sources[index];
    }

    function restartAutoAdvance() {
      window.clearInterval(autoAdvance);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        autoAdvance = window.setInterval(() => show(currentIndex + 1, false), 7000);
      }
    }

    function show(requestedIndex, userInitiated) {
      const index = (requestedIndex + sources.length) % sources.length;
      if (index === currentIndex) return;

      image.classList.add("is-changing");
      window.setTimeout(() => {
        currentIndex = index;
        image.src = sources[currentIndex];
        image.alt = `Gallery image ${currentIndex + 1} of ${sources.length}`;
        dotButtons.forEach((dot, dotIndex) =>
          dot.setAttribute("aria-current", dotIndex === currentIndex ? "true" : "false"),
        );
        image.classList.remove("is-changing");
        preload((currentIndex + 1) % sources.length);
      }, 120);

      if (userInitiated) restartAutoAdvance();
    }

    previous.addEventListener("click", () => show(currentIndex - 1, true));
    next.addEventListener("click", () => show(currentIndex + 1, true));
    wrapper.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") show(currentIndex - 1, true);
      if (event.key === "ArrowRight") show(currentIndex + 1, true);
    });
    wrapper.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX ?? null;
      },
      { passive: true },
    );
    wrapper.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
        if (Math.abs(distance) > 45) show(currentIndex + (distance < 0 ? 1 : -1), true);
        touchStartX = null;
      },
      { passive: true },
    );
    wrapper.addEventListener("mouseenter", () => window.clearInterval(autoAdvance));
    wrapper.addEventListener("mouseleave", restartAutoAdvance);

    wrapper.append(previous, next, dots);
    preload(1);
    restartAutoAdvance();
  }

  function initialiseGalleries() {
    const scripts = Array.from(document.querySelectorAll('script[data-role="hydration"]')).filter(
      (script) => script.textContent?.includes('"type":"SSR_IMAGE_SLIDER"'),
    );
    scripts.forEach((script, index) => initialiseGallery(script, index + 1));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseGalleries, { once: true });
  } else {
    initialiseGalleries();
  }
})();
