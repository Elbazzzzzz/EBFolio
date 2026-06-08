(function () {
  var lead = document.querySelector(".bio__lead");
  if (!lead) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var text = lead.textContent;
  lead.textContent = "";

  var chars = [];
  Array.from(text).forEach(function (ch) {
    var span = document.createElement("span");
    span.className = "bio__char bio__char--muted";
    span.textContent = ch;
    lead.appendChild(span);
    chars.push(span);
  });

  if (!chars.length) return;

  var readOrder = [];

  function sortByReadingOrder() {
    var positions = chars.map(function (span, index) {
      var rect = span.getBoundingClientRect();
      return { index: index, top: rect.top, left: rect.left };
    });

    positions.sort(function (a, b) {
      if (Math.abs(a.top - b.top) > 1) return a.top - b.top;
      return a.left - b.left;
    });

    readOrder = positions.map(function (item) {
      return item.index;
    });
  }

  sortByReadingOrder();

  var ticking = false;
  var hasScrolled = false;

  function isInViewport() {
    var rect = lead.getBoundingClientRect();
    var viewport = window.innerHeight;
    return rect.top < viewport && rect.bottom > 0;
  }

  function updateHighlight() {
    ticking = false;

    var progress = 0;

    if (hasScrolled && isInViewport()) {
      var rect = lead.getBoundingClientRect();
      var viewport = window.innerHeight;
      var start = viewport * 0.9;
      var end = viewport * 0.2;
      var range = start - end;
      progress = range > 0 ? (start - rect.top) / range : 1;
      progress = Math.max(0, Math.min(1, progress));
    }

    var revealedCount = Math.floor(progress * readOrder.length);

    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.add("bio__char--muted");
    }

    for (var j = 0; j < revealedCount; j++) {
      chars[readOrder[j]].classList.remove("bio__char--muted");
    }
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHighlight);
  }

  function onScroll() {
    hasScrolled = true;
    requestUpdate();
  }

  function onResize() {
    sortByReadingOrder();
    requestUpdate();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  updateHighlight();
})();
