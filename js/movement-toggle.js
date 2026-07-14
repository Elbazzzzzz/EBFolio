(function () {
  "use strict";

  var STORAGE_KEY = "pfmay-movement-paused";

  function isGifSrc(src) {
    return /\.gif(\?|#|$)/i.test(src || "");
  }

  function getGifs(root) {
    return Array.prototype.slice
      .call((root || document).querySelectorAll("img"))
      .filter(function (img) {
        return isGifSrc(img.getAttribute("src") || img.currentSrc);
      });
  }

  function freezeGif(img) {
    if (img.dataset.movementFrozen === "true") {
      return;
    }

    var source = img.dataset.movementGifSrc || img.currentSrc || img.src;
    img.dataset.movementGifSrc = source;

    if (!img.complete || !img.naturalWidth) {
      img.addEventListener(
        "load",
        function onLoad() {
          img.removeEventListener("load", onLoad);
          freezeGif(img);
        },
        { once: true }
      );
      return;
    }

    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);

    img.src = canvas.toDataURL("image/png");
    img.dataset.movementFrozen = "true";
  }

  function unfreezeGif(img) {
    var source = img.dataset.movementGifSrc;
    if (!source) {
      return;
    }

    img.src = "";
    img.src = source;
    delete img.dataset.movementFrozen;
  }

  function isPaused() {
    return document.documentElement.dataset.movementPaused === "true";
  }

  function setPaused(paused) {
    document.documentElement.dataset.movementPaused = paused ? "true" : "false";

    try {
      localStorage.setItem(STORAGE_KEY, paused ? "true" : "false");
    } catch (error) {}

    getGifs().forEach(function (img) {
      if (paused) {
        freezeGif(img);
      } else {
        unfreezeGif(img);
      }
    });
  }

  function syncToggle(toggle, statusEl) {
    if (!toggle) {
      return;
    }

    var paused = isPaused();
    toggle.setAttribute("aria-checked", paused ? "true" : "false");

    if (statusEl) {
      statusEl.textContent = paused
        ? "Movement on. Animated GIFs are paused."
        : "Movement off. Animated GIFs will play.";
    }
  }

  function initToggle() {
    var toggle = document.getElementById("movement-toggle");
    var statusEl = document.getElementById("movement-toggle-status");
    if (!toggle) {
      return;
    }

    syncToggle(toggle, statusEl);

    toggle.addEventListener("click", function () {
      setPaused(!isPaused());
      syncToggle(toggle, statusEl);
    });
  }

  function initFromStorage() {
    var paused = false;

    try {
      paused = localStorage.getItem(STORAGE_KEY) === "true";
    } catch (error) {}

    document.documentElement.dataset.movementPaused = paused ? "true" : "false";

    if (paused) {
      getGifs().forEach(freezeGif);
    }
  }

  function init() {
    initFromStorage();
    initToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
