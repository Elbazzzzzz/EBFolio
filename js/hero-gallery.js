(function () {
  const root = document.getElementById("hero-gallery");
  if (!root) return;

  const stage = root.querySelector(".hero-gallery__stage");
  const slides = Array.from(root.querySelectorAll(".hero-gallery__slide"));
  const prevBtn = root.querySelector(".hero-gallery__arrow--prev");
  const nextBtn = root.querySelector(".hero-gallery__arrow--next");
  const status = document.getElementById("hero-gallery-status");
  if (!stage || slides.length === 0 || !prevBtn || !nextBtn) return;

  const REDUCE =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.movementPaused === "true";
  const MOBILE_MQ = window.matchMedia("(max-width: 768px)");

  let index = Math.max(
    0,
    slides.findIndex((s) => s.classList.contains("is-active"))
  );
  let animating = false;

  function isMobile() {
    return MOBILE_MQ.matches;
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
        behavior: REDUCE ? "auto" : "smooth",
      });
    }
  }

  function goTo(next) {
    if (next < 0 || next >= slides.length || next === index || animating) return;

    if (isMobile() || REDUCE) {
      showInstant(next);
      return;
    }

    animating = true;
    const current = slides[index];
    const incoming = slides[next];

    incoming.hidden = false;
    incoming.classList.add("is-enter");
    // force reflow so enter transition runs from a resting state
    void incoming.offsetWidth;
    current.classList.add("is-exit");
    current.classList.remove("is-active");
    incoming.classList.add("is-active");

    window.setTimeout(function () {
      current.classList.remove("is-exit");
      current.hidden = true;
      incoming.classList.remove("is-enter");
      index = next;
      animating = false;
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

  stage.addEventListener(
    "wheel",
    function (event) {
      if (isMobile()) return;
      const dy = event.deltaY;
      if (Math.abs(dy) < 4) return;

      const goingNext = dy > 0;
      const atStart = index <= 0;
      const atEnd = index >= slides.length - 1;

      if ((goingNext && atEnd) || (!goingNext && atStart)) {
        return; // pass through to page
      }

      event.preventDefault();
      if (animating) return;
      step(goingNext ? 1 : -1);
    },
    { passive: false }
  );

  stage.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  });

  function syncMode() {
    if (isMobile()) {
      slides.forEach((s) => {
        s.hidden = false;
        s.classList.remove("is-exit", "is-enter");
      });
      slides[index].classList.add("is-active");
    } else {
      showInstant(index);
    }
    updateChrome();
  }

  MOBILE_MQ.addEventListener("change", syncMode);
  syncMode();
})();
