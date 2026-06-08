(function () {
  var main = document.querySelector("main.main-stack");
  if (!main) return;

  var DESKTOP_MQ = window.matchMedia("(min-width: 1101px)");
  var OVERVIEW_ID = "overview";

  var SECTION_DEFS = [
    { id: OVERVIEW_ID, label: "Overview", selector: ".hero-home", isOverview: true },
    { id: "bio", label: "Bio", selector: "#bio", hashAliases: ["bio-heading"] },
    { id: "projects", label: "Projects", selector: "#projects", hashAliases: ["projects-heading"] },
    { id: "experience", label: "Experience", selector: "#experience", hashAliases: ["experience-heading"] },
  ];

  var nav = null;
  var track = null;
  var indicator = null;
  var navItems = [];
  var observer = null;
  var intersecting = new Set();
  var pendingId = null;
  var pendingTimer = null;
  var resizeTimer = null;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var initialHash = window.location.hash.slice(1);

  function getScrollOffset() {
    var header = document.querySelector(".site-header");
    if (!header) return 104;
    return header.getBoundingClientRect().bottom;
  }

  function getSpyBandMargin() {
    var top = Math.round(getScrollOffset());
    var bottom = Math.max(0, window.innerHeight - top - 1);
    return "-" + top + "px 0px -" + bottom + "px 0px";
  }

  function matchesHash(item, hash) {
    if (!hash || item.isOverview) return false;
    if (item.id === hash) return true;
    return item.hashAliases && item.hashAliases.indexOf(hash) !== -1;
  }

  function findItemByHash(hash) {
    if (!hash) return navItems.find(function (item) { return item.isOverview; }) || null;
    return navItems.find(function (item) { return matchesHash(item, hash); }) || null;
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
    positionIndicator(id);
  }

  function positionIndicator(id) {
    if (!indicator || !track) return;

    var item = navItems.find(function (entry) { return entry.id === id; });
    if (!item) return;

    var trackRect = track.getBoundingClientRect();
    var linkRect = item.link.getBoundingClientRect();
    var dotSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cs-nav-dot-size")) || 6;
    var x = linkRect.left - trackRect.left + (linkRect.width - dotSize) / 2;

    indicator.style.setProperty("--home-subnav-indicator-x", x + "px");
    indicator.style.transform = "translateX(" + x + "px)";
    indicator.hidden = false;
  }

  function bounceIndicator() {
    if (!indicator || prefersReducedMotion) return;

    indicator.classList.remove("home-subnav__indicator--bounce");
    void indicator.offsetWidth;
    indicator.classList.add("home-subnav__indicator--bounce");
  }

  function onIndicatorAnimationEnd(event) {
    if (!indicator || event.target !== indicator) return;
    if (event.animationName !== "home-subnav-indicator-bounce") return;
    indicator.classList.remove("home-subnav__indicator--bounce");
  }

  function resolveActiveFromScroll() {
    if (pendingId) return pendingId;

    var activeId = OVERVIEW_ID;

    if (intersecting.size) {
      navItems.forEach(function (item) {
        if (item.element && intersecting.has(item.element)) {
          activeId = item.id;
        }
      });
      return activeId;
    }

    var spyLine = getScrollOffset();
    navItems.forEach(function (item) {
      if (!item.element || item.isOverview) return;
      if (item.element.getBoundingClientRect().top <= spyLine) {
        activeId = item.id;
      }
    });

    return activeId;
  }

  function syncActiveFromScroll() {
    setActive(resolveActiveFromScroll());
  }

  function clearPending() {
    pendingId = null;
    clearTimeout(pendingTimer);
    syncActiveFromScroll();
  }

  function beginPending(id) {
    pendingId = id;
    clearTimeout(pendingTimer);
    setActive(id);
    pendingTimer = setTimeout(clearPending, prefersReducedMotion ? 80 : 1200);
  }

  function scrollToSection(element) {
    var offset = getScrollOffset();
    var top = window.scrollY + element.getBoundingClientRect().top - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function navigateTo(item) {
    var currentId = pendingId || resolveActiveFromScroll();
    if (currentId === item.id) {
      bounceIndicator();
    }

    beginPending(item.id);

    if (item.isOverview) {
      scrollToTop();
      history.pushState(null, "", window.location.pathname + window.location.search);
      return;
    }

    scrollToSection(item.element);
    history.pushState(null, "", "#" + item.id);
  }

  function onIntersect(entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        intersecting.add(entry.target);
      } else {
        intersecting.delete(entry.target);
      }
    });

    if (!pendingId) {
      syncActiveFromScroll();
    }
  }

  function createObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: getSpyBandMargin(),
      threshold: 0,
    });

    navItems.forEach(function (item) {
      if (item.element) observer.observe(item.element);
    });
  }

  function createNavItem(def, element) {
    var item = document.createElement("li");
    item.className = "home-subnav__item";

    var link = document.createElement("a");
    link.className = "home-subnav__link";
    link.href = def.isOverview ? "#" : "#" + def.id;

    var dotSlot = document.createElement("span");
    dotSlot.className = "home-subnav__dot-slot";
    dotSlot.setAttribute("aria-hidden", "true");

    var linkLabel = document.createElement("span");
    linkLabel.className = "home-subnav__label";
    linkLabel.textContent = def.label;

    link.appendChild(dotSlot);
    link.appendChild(linkLabel);
    item.appendChild(link);

    link.addEventListener("click", function (e) {
      e.preventDefault();
      navigateTo(navItems.find(function (entry) { return entry.id === def.id; }));
    });

    return {
      id: def.id,
      label: def.label,
      link: link,
      item: item,
      element: element,
      isOverview: !!def.isOverview,
      hashAliases: def.hashAliases || null,
    };
  }

  function buildNav() {
    nav = document.createElement("nav");
    nav.className = "home-subnav";
    nav.setAttribute("aria-label", "Page sections");

    track = document.createElement("div");
    track.className = "home-subnav__track";

    indicator = document.createElement("span");
    indicator.className = "home-subnav__indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.hidden = true;
    indicator.addEventListener("animationend", onIndicatorAnimationEnd);

    var list = document.createElement("ul");
    list.className = "home-subnav__list";

    SECTION_DEFS.forEach(function (def) {
      var element = document.querySelector(def.selector);
      if (!element) return;

      var navItem = createNavItem(def, element);
      list.appendChild(navItem.item);
      navItems.push(navItem);
    });

    if (!navItems.length) return;

    track.appendChild(indicator);
    track.appendChild(list);
    nav.appendChild(track);
    document.body.appendChild(nav);

    createObserver();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("hashchange", onHashChange);

    if ("onscrollend" in window) {
      window.addEventListener("scrollend", onScrollEnd, { passive: true });
    }

    syncActiveFromScroll();

    if (initialHash) {
      var match = findItemByHash(initialHash);
      if (match && !match.isOverview) {
        requestAnimationFrame(function () {
          beginPending(match.id);
          scrollToSection(match.element);
        });
      }
    }
  }

  function onScroll() {
    if (pendingId) return;
    syncActiveFromScroll();
  }

  function onScrollEnd() {
    clearPending();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      createObserver();
      positionIndicator(resolveActiveFromScroll());
    }, 100);
  }

  function onHashChange() {
    if (!navItems.length) return;

    var hash = window.location.hash.slice(1);
    var match = findItemByHash(hash);

    if (!match) return;

    beginPending(match.id);
    if (match.isOverview) {
      scrollToTop();
    } else {
      scrollToSection(match.element);
    }
  }

  function destroyNav() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    intersecting.clear();
    pendingId = null;
    clearTimeout(pendingTimer);
    clearTimeout(resizeTimer);

    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("hashchange", onHashChange);

    if ("onscrollend" in window) {
      window.removeEventListener("scrollend", onScrollEnd);
    }

    if (nav) {
      nav.remove();
      nav = null;
    }

    track = null;
    indicator = null;
    navItems = [];
  }

  function connect() {
    if (DESKTOP_MQ.matches) {
      if (!nav) buildNav();
    } else {
      destroyNav();
    }
  }

  if (typeof DESKTOP_MQ.addEventListener === "function") {
    DESKTOP_MQ.addEventListener("change", connect);
  } else {
    DESKTOP_MQ.addListener(connect);
  }

  connect();
})();
