(function () {
  var dropdowns = document.querySelectorAll(".nav-dropdown");
  if (!dropdowns.length) return;

  dropdowns.forEach(function (dropdown) {
    var toggle = dropdown.querySelector(".nav-dropdown__toggle");
    var menu = dropdown.querySelector(".nav-dropdown__menu");
    var closeBtn = dropdown.querySelector(".nav-dropdown__close");
    if (!toggle || !menu) return;

    function getItems() {
      var items = Array.prototype.slice.call(
        menu.querySelectorAll(".nav-dropdown__item")
      );
      if (closeBtn) items.push(closeBtn);
      return items;
    }

    function open() {
      dropdown.classList.add("nav-dropdown--open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function close(returnFocus) {
      var wasOpen = isOpen();
      dropdown.classList.remove("nav-dropdown--open");
      toggle.setAttribute("aria-expanded", "false");
      if (wasOpen && returnFocus) toggle.focus();
    }

    function isOpen() {
      return dropdown.classList.contains("nav-dropdown--open");
    }

    function focusItem(index) {
      var items = getItems();
      if (!items.length) return;
      var next = ((index % items.length) + items.length) % items.length;
      items[next].focus();
    }

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen()) {
        close(false);
      } else {
        open();
        // Keyboard activation (Enter/Space fires click with detail 0):
        // move focus to the first menu item, per the menu-button pattern.
        if (event.detail === 0) focusItem(0);
      }
    });

    toggle.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!isOpen()) open();
        focusItem(0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen()) open();
        focusItem(-1);
      }
    });

    menu.addEventListener("keydown", function (event) {
      var items = getItems();
      var index = items.indexOf(document.activeElement);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusItem(index + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusItem(index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusItem(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusItem(-1);
      } else if (event.key === "Tab") {
        // Tab leaves the menu; close it so it doesn't linger over content.
        close(false);
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      });
    }

    menu.addEventListener("click", function (event) {
      if (event.target.closest(".nav-dropdown__item")) {
        close(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (!dropdown.contains(event.target)) {
        close(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        // Return focus to the toggle only if focus was inside the dropdown.
        close(dropdown.contains(document.activeElement));
      }
    });
  });
})();
