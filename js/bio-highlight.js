(function () {
  var lead = document.querySelector(".bio__lead");
  if (!lead) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var text = lead.textContent;
  lead.textContent = "";

  var chars = [];
  Array.from(text).forEach(function (ch) {
    var span = document.createElement("span");
    span.className = "bio__char";
    span.textContent = ch;
    lead.appendChild(span);
    chars.push(span);
  });

  if (!chars.length) return;

  var readOrder = chars.map(function (_, index) {
    return index;
  });

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

  function updateHighlight() {
    ticking = false;

    var rect = lead.getBoundingClientRect();
    var viewport = window.innerHeight;
    var start = viewport * 0.9;
    var end = viewport * 0.2;
    var range = start - end;
    var progress = range > 0 ? (start - rect.top) / range : 1;
    progress = Math.max(0, Math.min(1, progress));

    var highlightedCount = Math.floor(progress * readOrder.length);

    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.remove("bio__char--muted");
    }

    for (var j = 0; j < highlightedCount; j++) {
      chars[readOrder[j]].classList.add("bio__char--muted");
    }
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHighlight);
  }

  function onResize() {
    sortByReadingOrder();
    requestUpdate();
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  updateHighlight();
})();
