(function () {
  var dropdowns = document.querySelectorAll(".nav-dropdown");
  if (!dropdowns.length) return;

  dropdowns.forEach(function (dropdown) {
    var toggle = dropdown.querySelector(".nav-dropdown__toggle");
    var menu = dropdown.querySelector(".nav-dropdown__menu");
    var closeBtn = dropdown.querySelector(".nav-dropdown__close");
    if (!toggle || !menu) return;

    function open() {
      dropdown.classList.add("nav-dropdown--open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function close() {
      dropdown.classList.remove("nav-dropdown--open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function isOpen() {
      return dropdown.classList.contains("nav-dropdown--open");
    }

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen()) {
        close();
      } else {
        open();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        close();
        toggle.focus();
      });
    }

    menu.addEventListener("click", function (event) {
      if (event.target.closest(".nav-dropdown__item")) {
        close();
      }
    });

    document.addEventListener("click", function (event) {
      if (!dropdown.contains(event.target)) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        close();
      }
    });
  });
})();
