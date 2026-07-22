(function () {
  var main = document.querySelector("main.cs-stack");
  if (!main) return;

  var sections = main.querySelectorAll(":scope > .cs-section");
  if (!sections.length) return;

  var scrollY = window.scrollY;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  var projects = main.querySelector(":scope > .projects");
  var toMove = [];
  var child = main.firstElementChild;

  while (child && child !== projects) {
    toMove.push(child);
    child = child.nextElementSibling;
  }

  var layout = document.createElement("div");
  layout.className = "cs-layout";

  var layoutMain = document.createElement("div");
  layoutMain.className = "cs-layout__main";

  var successMetrics = main.querySelector(".cs-success-metrics");

  var aside = document.createElement("aside");
  aside.className = "cs-layout__aside";

  var nav = document.createElement("nav");
  nav.className = "cs-article-nav";
  nav.setAttribute("aria-label", "Case study sections");

  var list = document.createElement("ul");
  list.className = "cs-article-nav__list";

  var OVERVIEW_ID = "overview";
  var navItems = [];

  function createNavItem(id, label, options) {
    options = options || {};

    var item = document.createElement("li");
    item.className = "cs-article-nav__item";

    var link = document.createElement("a");
    link.className = "cs-article-nav__link";
    link.href = options.isOverview ? "#" : "#" + id;

    var dot = document.createElement("span");
    dot.className = "cs-article-nav__dot";
    dot.setAttribute("aria-hidden", "true");

    var linkLabel = document.createElement("span");
    linkLabel.className = "cs-article-nav__label";
    linkLabel.textContent = label;

    link.appendChild(dot);
    link.appendChild(linkLabel);
    item.appendChild(link);
    list.appendChild(item);

    navItems.push({
      id: id,
      link: link,
      isOverview: !!options.isOverview,
      section: options.section || null,
      heading: options.heading || null,
    });
  }

  createNavItem(OVERVIEW_ID, "Overview", { isOverview: true });

  sections.forEach(function (section) {
    var sectionHeading = section.querySelector(":scope > h2[id]");
    if (!sectionHeading) return;

    var navLabel = sectionHeading.getAttribute("data-nav-label") || sectionHeading.textContent.trim();

    createNavItem(sectionHeading.id, navLabel, {
      section: section,
      heading: sectionHeading,
    });
  });

  if (!navItems.length) return;

  nav.appendChild(list);
  aside.appendChild(nav);

  toMove.forEach(function (node) {
    layoutMain.appendChild(node);
  });

  layout.appendChild(layoutMain);
  layout.appendChild(aside);

  var mobileIntroMq = window.matchMedia("(max-width: 768px)");

  function placeSuccessMetrics() {
    if (!successMetrics) return;

    var csIntro = layoutMain.querySelector(".cs-intro");
    var csMeta = csIntro && csIntro.querySelector(".cs-meta");

    if (mobileIntroMq.matches && csMeta) {
      csMeta.insertAdjacentElement("afterend", successMetrics);
      return;
    }

    aside.appendChild(successMetrics);
  }

  if (projects) {
    main.insertBefore(layout, projects);
  } else {
    main.appendChild(layout);
  }

  placeSuccessMetrics();
  mobileIntroMq.addEventListener("change", placeSuccessMetrics);

  window.scrollTo(0, scrollY);

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scrollTicking = false;
  var initialHash = window.location.hash.slice(1);

  function setActive(id) {
    navItems.forEach(function (item) {
      var isActive = item.id === id;
      item.link.classList.toggle("cs-article-nav__link--active", isActive);
      if (isActive) {
        item.link.setAttribute("aria-current", "true");
      } else {
        item.link.removeAttribute("aria-current");
      }
    });
  }

  function getScrollSpyLine() {
    var top = parseFloat(getComputedStyle(nav).top);
    return (isNaN(top) ? 164 : top) + 1;
  }

  function updateActiveFromScroll() {
    scrollTicking = false;

    var spyLine = getScrollSpyLine();
    var active = navItems[0];

    for (var i = 1; i < navItems.length; i++) {
      if (navItems[i].heading.getBoundingClientRect().top <= spyLine) {
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

  navItems.forEach(function (item) {
    item.link.addEventListener("click", function (e) {
      e.preventDefault();
      if (item.isOverview) {
        scrollToTop();
        history.pushState(null, "", window.location.pathname + window.location.search);
      } else {
        scrollToTarget(item.heading);
        history.pushState(null, "", "#" + item.id);
      }
      setActive(item.id);
    });
  });

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });

  setActive(OVERVIEW_ID);

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

  window.addEventListener(
    "load",
    function () {
      window.scrollTo(0, scrollY);
      if (!initialHash) {
        setActive(OVERVIEW_ID);
      }
    },
    { once: true }
  );
})();
