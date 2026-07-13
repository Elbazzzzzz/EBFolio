(function () {
  function getScrollOffset() {
    var header = document.querySelector(".site-header");
    if (!header) return 0;
    // Match the post-scroll floating-header offset (same math as home-nav.js),
    // so anchor targets and scroll-spy highlighting agree on section positions.
    var floatTop = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--float-nav-top")
    );
    if (isNaN(floatTop)) floatTop = 16;
    return floatTop + header.offsetHeight;
  }

  function scrollToHashTarget(target) {
    var offset = getScrollOffset();
    var top = window.scrollY + target.getBoundingClientRect().top - offset;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#") {
        e.preventDefault();
        return;
      }
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      scrollToHashTarget(target);
    });
  });
})();
