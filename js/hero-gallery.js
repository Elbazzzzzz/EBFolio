(function () {
  const root = document.getElementById("hero-gallery");
  if (!root) return;

  const stage = root.querySelector(".hero-gallery__stage");
  const slides = Array.from(root.querySelectorAll(".hero-gallery__slide"));
  const prevBtn = root.querySelector(".hero-gallery__arrow--prev");
  const nextBtn = root.querySelector(".hero-gallery__arrow--next");
  const status = document.getElementById("hero-gallery-status");
  if (!stage || slides.length === 0 || !prevBtn || !nextBtn) return;

  const MOBILE_MQ = window.matchMedia("(max-width: 768px)");
  const REDUCE_MQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  let index = Math.max(
    0,
    slides.findIndex((s) => s.classList.contains("is-active"))
  );
  let animating = false;
  let animTimeout = null;
  let scrollSyncTimer = null;
  let wheelAccum = 0;
  let wheelLockUntil = 0;

  const WHEEL_STEP_PX = 48;
  const WHEEL_LOCK_MS = 450;

  function isMobile() {
    return MOBILE_MQ.matches;
  }

  function shouldReduceMotion() {
    return (
      REDUCE_MQ.matches ||
      document.documentElement.dataset.movementPaused === "true"
    );
  }

  function clearAnimTimeout() {
    if (animTimeout !== null) {
      window.clearTimeout(animTimeout);
      animTimeout = null;
    }
    animating = false;
  }

  function updateChrome() {
    const atStart = index <= 0;
    const atEnd = index >= slides.length - 1;
    prevBtn.setAttribute("aria-disabled", atStart ? "true" : "false");
    nextBtn.setAttribute("aria-disabled", atEnd ? "true" : "false");
    if (status) {
      status.textContent = "Slide " + (index + 1) + " of " + slides.length;
    }
  }

  function showInstant(next) {
    slides.forEach((slide, i) => {
      const on = i === next;
      slide.classList.toggle("is-active", on);
      slide.classList.remove("is-exit", "is-enter");
      if (isMobile()) {
        slide.hidden = false;
      } else {
        slide.hidden = !on;
      }
    });
    index = next;
    updateChrome();
    if (isMobile()) {
      slides[next].scrollIntoView({
        inline: "start",
        block: "nearest",
        behavior: shouldReduceMotion() ? "auto" : "smooth",
      });
    }
  }

  function goTo(next) {
    if (next < 0 || next >= slides.length || next === index || animating) return;

    if (isMobile() || shouldReduceMotion()) {
      showInstant(next);
      return;
    }

    const current = slides[index];
    const incoming = slides[next];

    animating = true;
    incoming.hidden = false;
    incoming.classList.add("is-enter");
    // force reflow so enter transition runs from a resting state
    void incoming.offsetWidth;
    current.classList.add("is-exit");
    current.classList.remove("is-active");
    incoming.classList.add("is-active");

    animTimeout = window.setTimeout(function () {
      current.classList.remove("is-exit");
      current.hidden = true;
      incoming.classList.remove("is-enter");
      index = next;
      animating = false;
      animTimeout = null;
      updateChrome();
    }, 420);
  }

  function step(delta) {
    goTo(index + delta);
  }

  prevBtn.addEventListener("click", function () {
    if (prevBtn.getAttribute("aria-disabled") === "true") return;
    step(-1);
  });

  nextBtn.addEventListener("click", function () {
    if (nextBtn.getAttribute("aria-disabled") === "true") return;
    step(1);
  });

  // Trap wheel over the whole gallery (stage + arrows + tags). Always
  // preventDefault while not at an end, including tiny trackpad deltas —
  // otherwise the page scrolls underneath between steps.
  root.addEventListener(
    "wheel",
    function (event) {
      if (isMobile()) return;

      const dy = event.deltaY;
      if (dy === 0) return;

      const goingNext = dy > 0;
      const atStart = index <= 0;
      const atEnd = index >= slides.length - 1;

      if ((goingNext && atEnd) || (!goingNext && atStart)) {
        wheelAccum = 0;
        return; // pass through to page at ends
      }

      event.preventDefault();
      event.stopPropagation();

      const now = Date.now();
      if (animating || now < wheelLockUntil) return;

      wheelAccum += dy;
      if (Math.abs(wheelAccum) < WHEEL_STEP_PX) return;

      const direction = wheelAccum > 0 ? 1 : -1;
      wheelAccum = 0;
      wheelLockUntil = now + WHEEL_LOCK_MS;
      step(direction);
    },
    { passive: false }
  );

  root.addEventListener("mouseleave", function () {
    wheelAccum = 0;
  });

  stage.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      const atEnd = index >= slides.length - 1;
      if (atEnd) return; // pass through like wheel
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      const atStart = index <= 0;
      if (atStart) return; // pass through like wheel
      event.preventDefault();
      step(-1);
    }
  });

  function nearestSlideIndex() {
    const stageRect = stage.getBoundingClientRect();
    const stageCenter = stageRect.left + stageRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach(function (slide, i) {
      const rect = slide.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(center - stageCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }

  stage.addEventListener(
    "scroll",
    function () {
      if (!isMobile()) return;
      if (scrollSyncTimer !== null) {
        window.clearTimeout(scrollSyncTimer);
      }
      scrollSyncTimer = window.setTimeout(function () {
        scrollSyncTimer = null;
        const nearest = nearestSlideIndex();
        if (nearest === index) return;
        index = nearest;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("is-active", i === index);
        });
        updateChrome();
      }, 80);
    },
    { passive: true }
  );

  function syncMode() {
    clearAnimTimeout();
    if (isMobile()) {
      slides.forEach(function (s, i) {
        s.hidden = false;
        s.classList.toggle("is-active", i === index);
        s.classList.remove("is-exit", "is-enter");
      });
      updateChrome();
    } else {
      showInstant(index);
    }
  }

  MOBILE_MQ.addEventListener("change", syncMode);
  syncMode();
})();
