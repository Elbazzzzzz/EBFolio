/**
 * Mobile (≤768px): show sticky bottom nav only after homepage hero CTAs
 * (CV + Contact me) are fully scrolled out of view.
 * Pages without [data-mobile-nav-sentinel] keep the bar always available on mobile.
 */
(function () {
  var mq = window.matchMedia("(max-width: 768px)");
  var nav = document.querySelector(".nav-mobile");
  var sentinel = document.querySelector("[data-mobile-nav-sentinel]");

  if (!nav) return;

  var observer = null;

  function setVisible(show) {
      nav.classList.toggle("nav-mobile--show", show);
      nav.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function heroCtasInViewport(el) {
      var r = el.getBoundingClientRect();
      var w = window.innerWidth;
      var h = window.innerHeight;
      return r.top < h && r.bottom > 0 && r.left < w && r.right > 0;
  }

  function onIntersect(entries) {
      if (!mq.matches) return;
      var intersecting = entries[0].isIntersecting;
      setVisible(!intersecting);
  }

  function connect() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (!mq.matches) {
        setVisible(false);
        return;
      }

      if (!sentinel) {
        setVisible(true);
        return;
      }

      observer = new IntersectionObserver(onIntersect, {
        root: null,
        threshold: 0,
        rootMargin: "0px",
      });
      observer.observe(sentinel);
      setVisible(!heroCtasInViewport(sentinel));
  }

  if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", connect);
  } else {
      mq.addListener(connect);
  }

  if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", connect);
  } else {
      connect();
  }
})();
