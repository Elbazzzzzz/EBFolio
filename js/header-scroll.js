/**
 * Top nav: transparent and flush at page top; floating glass bar after scroll.
 */
(function () {
  var SCROLL_THRESHOLD = 12;
  var root = document.documentElement;
  var header = document.querySelector(".site-header");

  if (!header) return;

  function update() {
    root.classList.toggle("is-header-floating", window.scrollY > SCROLL_THRESHOLD);
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
})();
