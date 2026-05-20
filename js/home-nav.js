(function () {
  var main = document.querySelector("main.main-stack");
  if (!main) return;

  var desktopMq = window.matchMedia("(min-width: 1101px)");
  var nav = null;
  var navItems = [];
  var scrollTicking = false;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var initialHash = window.location.hash.slice(1);

  var SECTIONS = [
    { id: "overview", label: "Overview", isOverview: true },
    { id: "bio-heading", label: "Bio" },
    { id: "projects-heading", label: "Projects" },
    { id: "experience-heading", label: "Experience" },
  ];

  function getScrollSpyLine() {
    var offset = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--home-subnav-scroll-spy")
    );
    return isNaN(offset) ? 164 : offset;
  }

  function setActive(id) {
    navItems.forEach(function (item) {
      var isActive = item.id === id;
      item.link.classList.toggle("home-subnav__link--active", isActive);
      if (isActive) {
        item.link.setAttribute("aria-current", "true");
      } else {
        item.link.removeAttribute("aria-current");
      }
    });
  }

  function updateActiveFromScroll() {
    scrollTicking = false;

    if (!navItems.length) return;

    var spyLine = getScrollSpyLine();
    var active = navItems[0];

    for (var i = 1; i < navItems.length; i++) {
      if (navItems[i].heading && navItems[i].heading.getBoundingClientRect().top <= spyLine) {
        active = navItems[i];
      }
    }

    setActive(active.id);
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateActiveFromScroll);
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function scrollToTarget(target) {
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function createNavItem(id, label, options) {
    options = options || {};

    var item = document.createElement("li");
    item.className = "home-subnav__item";

    var link = document.createElement("a");
    link.className = "home-subnav__link";
    link.href = options.isOverview ? "#" : "#" + id;

    var dot = document.createElement("span");
    dot.className = "home-subnav__dot";
    dot.setAttribute("aria-hidden", "true");

    var linkLabel = document.createElement("span");
    linkLabel.className = "home-subnav__label";
    linkLabel.textContent = label;

    link.appendChild(dot);
    link.appendChild(linkLabel);
    item.appendChild(link);

    link.addEventListener("click", function (e) {
      e.preventDefault();
      if (options.isOverview) {
        scrollToTop();
        history.pushState(null, "", window.location.pathname + window.location.search);
      } else if (options.heading) {
        scrollToTarget(options.heading);
        history.pushState(null, "", "#" + id);
      }
      setActive(id);
    });

    return {
      id: id,
      link: link,
      item: item,
      isOverview: !!options.isOverview,
      heading: options.heading || null,
    };
  }

  function buildNav() {
    nav = document.createElement("nav");
    nav.className = "home-subnav";
    nav.setAttribute("aria-label", "Page sections");

    var list = document.createElement("ul");
    list.className = "home-subnav__list";

    SECTIONS.forEach(function (section) {
      var heading = section.isOverview ? null : document.getElementById(section.id);
      if (!section.isOverview && !heading) return;

      var navItem = createNavItem(section.id, section.label, {
        isOverview: section.isOverview,
        heading: heading,
      });

      list.appendChild(navItem.item);
      navItems.push(navItem);
    });

    if (!navItems.length) return;

    nav.appendChild(list);
    document.body.appendChild(nav);

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });

    setActive(navItems[0].id);
    updateActiveFromScroll();

    if (initialHash) {
      var match = navItems.find(function (item) {
        return !item.isOverview && item.id === initialHash;
      });
      if (match) {
        window.addEventListener(
          "load",
          function () {
            scrollToTarget(match.heading);
            setActive(match.id);
          },
          { once: true }
        );
      }
    }
  }

  function destroyNav() {
    if (nav) {
      nav.remove();
      nav = null;
    }
    navItems = [];
    window.removeEventListener("scroll", requestScrollUpdate);
    window.removeEventListener("resize", requestScrollUpdate);
  }

  function connect() {
    if (desktopMq.matches) {
      if (!nav) buildNav();
    } else {
      destroyNav();
    }
  }

  if (typeof desktopMq.addEventListener === "function") {
    desktopMq.addEventListener("change", connect);
  } else {
    desktopMq.addListener(connect);
  }

  connect();
})();
