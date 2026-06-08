(function () {
  function getScrollOffset() {
    var header = document.querySelector(".site-header");
    return header ? header.getBoundingClientRect().bottom : 0;
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
