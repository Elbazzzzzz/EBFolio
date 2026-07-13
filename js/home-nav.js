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
  var clickedLockId = null;
  var pendingTimer = null;
  var resizeTimer = null;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var initialHash = window.location.hash.slice(1);

  // Smooth scrolling can settle a fraction of a pixel short of the target,
  // so the spy line sits slightly below the scroll offset to absorb rounding.
  var SPY_TOLERANCE_PX = 2;

  function getScrollOffset() {
    var header = document.querySelector(".site-header");
    if (!header) return 104;
    // Measure the header's post-scroll (floating glass bar) position, not its
    // current one: scrolling to any section floats the header, and using its
    // pre-scroll bottom edge here would leave targets and the scroll-spy line
    // disagreeing about where sections start (indicator lands on the wrong item).
    var floatTop = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--float-nav-top")
    );
    if (isNaN(floatTop)) floatTop = 16;
    return floatTop + header.offsetHeight;
  }

  function getSpyLine() {
    return getScrollOffset() + SPY_TOLERANCE_PX;
  }

  function getSpyBandMargin() {
    var top = Math.round(getSpyLine());
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

  // Geometric resolution only: the section is active when its top has crossed
  // the spy line. Uses the exact same offset as the click scroll targets, so
  // clicked and scrolled states can never disagree. (The IntersectionObserver
  // is just an extra update trigger; its async entries aren't trusted here.)
  function resolveActiveFromScroll() {
    if (pendingId) return pendingId;

    // Fully scrolled: the last section is active even when the page is too
    // short for its top to ever reach the spy line.
    if (
      navItems.length &&
      window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
    ) {
      return navItems[navItems.length - 1].id;
    }

    var activeId = OVERVIEW_ID;
    var spyLine = getSpyLine();

    navItems.forEach(function (item) {
      if (!item.element || item.isOverview) return;
      if (item.element.getBoundingClientRect().top <= spyLine) {
        activeId = item.id;
      }
    });

    return activeId;
  }

  function syncActiveFromScroll() {
    var resolved = resolveActiveFromScroll();
    if (clickedLockId) {
      if (resolved === clickedLockId) {
        clickedLockId = null;
      } else {
        setActive(clickedLockId);
        return;
      }
    }
    setActive(resolved);
  }

  // keepClicked: the click navigation finished, so the clicked item stays
  // active even if the scroll was clamped short of the section (page bottom).
  // Without it (manual scroll took over), the scroll-spy resolves instead.
  function clearPending(keepClicked) {
    var id = pendingId;
    pendingId = null;
    clearTimeout(pendingTimer);
    if (keepClicked && id) {
      clickedLockId = id;
      setActive(id);
    } else {
      clickedLockId = null;
      syncActiveFromScroll();
    }
  }

  // The clicked section has arrived when its top sits at the spy line (same
  // offset the scroll target used), or the page can't scroll any further.
  function pendingArrived() {
    if (!pendingId) return false;

    var atBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;
    if (atBottom) return true;

    var item = navItems.find(function (entry) { return entry.id === pendingId; });
    if (!item || !item.element) return true;

    if (item.isOverview) {
      return item.element.getBoundingClientRect().top >= 0 || window.scrollY === 0;
    }

    return Math.abs(item.element.getBoundingClientRect().top - getScrollOffset()) <= 4;
  }

  function beginPending(id) {
    pendingId = id;
    clearTimeout(pendingTimer);
    setActive(id);
    // Safety net only: arrival (or scrollend) normally clears pending first.
    pendingTimer = setTimeout(function () {
      clearPending(true);
    }, prefersReducedMotion ? 80 : 3000);
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

  function scrollToOverview() {
    var target =
      document.querySelector(".hero-home") ||
      document.getElementById("main-content") ||
      document.querySelector(".page");

    if (target) {
      scrollToSection(target);
      return;
    }

    scrollToTop();
  }

  function navigateTo(item) {
    var currentId = pendingId || resolveActiveFromScroll();
    if (currentId === item.id) {
      bounceIndicator();
    }

    beginPending(item.id);

    if (item.isOverview) {
      scrollToOverview();
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

    list.addEventListener("keydown", function (event) {
      var links = navItems.map(function (item) {
        return item.link;
      });
      var index = links.indexOf(document.activeElement);
      if (index === -1) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        links[(index + 1) % links.length].focus();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        links[(index - 1 + links.length) % links.length].focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        links[0].focus();
      } else if (event.key === "End") {
        event.preventDefault();
        links[links.length - 1].focus();
      }
    });

    track.appendChild(indicator);
    track.appendChild(list);
    nav.appendChild(track);
    document.body.appendChild(nav);

    createObserver();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("hashchange", onHashChange);
    // Manual scroll input hands control back to the scroll-spy immediately.
    window.addEventListener("wheel", onUserScrollInput, { passive: true });
    window.addEventListener("touchmove", onUserScrollInput, { passive: true });

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
    if (pendingId) {
      if (pendingArrived()) clearPending(true);
      return;
    }
    syncActiveFromScroll();
  }

  function onUserScrollInput() {
    clickedLockId = null;
    if (pendingId) clearPending(false);
    else syncActiveFromScroll();
  }

  function onScrollEnd() {
    if (pendingId) clearPending(true);
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
      scrollToOverview();
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
    clickedLockId = null;
    clearTimeout(pendingTimer);
    clearTimeout(resizeTimer);

    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("wheel", onUserScrollInput);
    window.removeEventListener("touchmove", onUserScrollInput);

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
