(function () {
  var svg = document.querySelector(".hero-home__ticker-svg");
  var track = document.getElementById("hero-ticker-fill");
  var center = document.getElementById("hero-ticker-path");
  var textPath = document.querySelector(".hero-home__ticker-text-path");
  if (!svg || !track || !center || !textPath) return;

  var label = "Ellie Barrett User Experience Designer";
  var gap = "   \u2022   ";
  var segment = label + gap;
  var pathLength = 0;
  var segmentLength = 0;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var durationMs = 32000;
  var elapsed = 0;
  var lastFrameTime = null;
  var isPaused = false;
  var rafId = null;
  var ticker = document.querySelector(".hero-home__ticker");

  function getConfig() {
    var w = window.innerWidth;
    if (w <= 768) {
      return {
        startX: -520,
        endX: 1960,
        centerY: 220,
        amplitude: 80,
        wavelength: 520,
        halfWidth: 95,
        steps: 360,
      };
    }

    var scale = Math.max(0.72, Math.min(1, 1080 / w));

    return {
      startX: -520,
      endX: 1960,
      centerY: 220,
      amplitude: Math.round(72 * scale),
      wavelength: 520,
      halfWidth: Math.round(108 * scale),
      steps: 360,
    };
  }

  function toPath(coords) {
    return coords
      .map(function (point, index) {
        var cmd = index === 0 ? "M" : "L";
        return cmd + " " + point.x.toFixed(2) + " " + point.y.toFixed(2);
      })
      .join(" ");
  }

  function buildPaths() {
    var config = getConfig();
    var points = [];
    var i;

    for (i = 0; i <= config.steps; i += 1) {
      var t = i / config.steps;
      var x = config.startX + t * (config.endX - config.startX);
      var y =
        config.centerY +
        config.amplitude * Math.sin((2 * Math.PI / config.wavelength) * x);
      points.push({ x: x, y: y });
    }

    function offsetEdge(sign) {
      var edge = [];
      for (i = 0; i < points.length; i += 1) {
        var prev = points[Math.max(0, i - 1)];
        var next = points[Math.min(points.length - 1, i + 1)];
        var dx = next.x - prev.x;
        var dy = next.y - prev.y;
        var len = Math.hypot(dx, dy) || 1;
        edge.push({
          x: points[i].x + (-dy / len) * sign * config.halfWidth,
          y: points[i].y + (dx / len) * sign * config.halfWidth,
        });
      }
      return edge;
    }

    var top = offsetEdge(1);
    var bottom = offsetEdge(-1);
    var fillPath =
      toPath(top) +
      " L " +
      bottom
        .slice()
        .reverse()
        .map(function (point) {
          return point.x.toFixed(2) + " " + point.y.toFixed(2);
        })
        .join(" L ") +
      " Z";

    track.setAttribute("d", fillPath);
    center.setAttribute("d", toPath(points));
    pathLength = center.getTotalLength();
  }

  function measureSegmentLength() {
    textPath.textContent = segment;
    return textPath.getComputedTextLength() || 0;
  }

  function buildTickerText() {
    var repeats =
      Math.max(2, Math.ceil((pathLength + segmentLength) / segmentLength) + 1);
    textPath.textContent = new Array(repeats).fill(segment).join("");
  }

  function setStaticTicker() {
    textPath.textContent = label;
    textPath.setAttribute("text-anchor", "middle");
    textPath.setAttribute("startOffset", String(pathLength / 2));
  }

  function tick(timestamp) {
    if (!isPaused) {
      if (lastFrameTime !== null) {
        elapsed = (elapsed + (timestamp - lastFrameTime)) % durationMs;
      }
      lastFrameTime = timestamp;
      textPath.setAttribute(
        "startOffset",
        String((elapsed / durationMs) * segmentLength)
      );
    }
    rafId = requestAnimationFrame(tick);
  }

  function startAnimation(resetProgress) {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (resetProgress) {
      elapsed = 0;
      textPath.setAttribute("startOffset", "0");
    }
    lastFrameTime = null;
    isPaused = false;
    rafId = requestAnimationFrame(tick);
  }

  function pauseAnimation() {
    isPaused = true;
    lastFrameTime = null;
  }

  function resumeAnimation() {
    isPaused = false;
    lastFrameTime = null;
  }

  function refreshTicker(preserveProgress) {
    var progress = preserveProgress ? elapsed / durationMs : 0;

    buildPaths();
    segmentLength = measureSegmentLength();
    if (!segmentLength) return;

    if (prefersReducedMotion) {
      setStaticTicker();
      return;
    }

    buildTickerText();
    textPath.setAttribute("text-anchor", "start");
    elapsed = progress * durationMs;
    textPath.setAttribute(
      "startOffset",
      String(progress * segmentLength)
    );
    startAnimation(false);
  }

  refreshTicker(false);

  if (ticker) {
    ticker.addEventListener("mouseenter", pauseAnimation);
    ticker.addEventListener("mouseleave", resumeAnimation);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      refreshTicker(true);
    }, 150);
  });
})();
