const STORAGE_KEYS = Object.freeze({
  theme: "idsi_theme",
  dir: "idsi_dir",
});

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getEffectiveTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return getSystemTheme();
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(STORAGE_KEYS.theme);
  }

  syncThemeControls();
}

function syncThemeControls() {
  const effectiveTheme = getEffectiveTheme();
  const buttons = document.querySelectorAll('[data-action="toggle-theme"]');

  buttons.forEach((button) => {
    const isDark = effectiveTheme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("data-theme-state", effectiveTheme);
    button.setAttribute("aria-label", isDark ? "Switch to Light Theme" : "Switch to Dark Theme");
  });
}

function toggleTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  const systemTheme = getSystemTheme();
  const current = explicit === "light" || explicit === "dark" ? explicit : systemTheme;
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
}

function applyDir(dir) {
  const nextDir = dir === "rtl" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", nextDir);
  localStorage.setItem(STORAGE_KEYS.dir, nextDir);

  const ltrLink = document.getElementById("bootstrap-css-ltr");
  const rtlLink = document.getElementById("bootstrap-css-rtl");

  if (ltrLink && rtlLink) {
    const useRtl = nextDir === "rtl";
    ltrLink.disabled = useRtl;
    rtlLink.disabled = !useRtl;
  }

  syncDirControls();
}

function syncDirControls() {
  const currentDir = document.documentElement.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
  const buttons = document.querySelectorAll('[data-action="toggle-rtl"]');

  buttons.forEach((button) => {
    const isRtl = currentDir === "rtl";
    button.setAttribute("aria-pressed", String(isRtl));
    button.setAttribute("data-dir-state", currentDir);
    button.setAttribute("aria-label", isRtl ? "Switch to LTR Direction" : "Switch to RTL Direction");
    button.textContent = isRtl ? "LTR" : "RTL";
  });
}

function toggleDir() {
  const currentDir = document.documentElement.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
  const nextDir = currentDir === "rtl" ? "ltr" : "rtl";
  applyDir(nextDir);
}

function initPreferences() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  applyTheme(savedTheme);

  const savedDir = localStorage.getItem(STORAGE_KEYS.dir) || "ltr";
  applyDir(savedDir);

  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!document.documentElement.hasAttribute("data-theme")) syncThemeControls();
    };

    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
    else if (typeof mq.addListener === "function") mq.addListener(onChange);
  }
}

function bindPreferenceControls() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
    if (!target) return;

    const action = target.getAttribute("data-action");
    if (action === "toggle-theme") toggleTheme();
    if (action === "toggle-rtl") toggleDir();
  });
}

function normalizePath(pathname) {
  const raw = (pathname || "").toLowerCase();
  if (raw === "/" || raw.endsWith("/index.html")) return "index.html";
  const parts = raw.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "index.html";
}

function initActiveNav() {
  const current = normalizePath(window.location.pathname);
  const links = document.querySelectorAll("[data-nav] a.nav-link, [data-nav] a.dropdown-item");

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("http")) return;

    const normalizedHref = normalizePath(href);
    const isActive = normalizedHref === current;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const dropdowns = document.querySelectorAll("[data-nav] .dropdown");
  dropdowns.forEach((dd) => {
    const toggle = dd.querySelector(".dropdown-toggle");
    const activeChild = dd.querySelector(".dropdown-item.active");
    if (toggle) toggle.classList.toggle("active", Boolean(activeChild));
  });
}

function initOffcanvasNav() {
  const offcanvasEl = document.getElementById("siteOffcanvas");
  if (!offcanvasEl || typeof bootstrap === "undefined") return;

  offcanvasEl.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return;
    const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (instance) instance.hide();
  });
}

function initBackToTop() {
  const button = document.getElementById("backToTop");
  if (!button) return;

  const setVisible = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    button.classList.toggle("is-visible", y > 420);
  };

  setVisible();
  window.addEventListener("scroll", setVisible, { passive: true });

  button.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initFormValidation() {
  const forms = document.querySelectorAll("form[data-validate]");
  if (!forms.length) return;

  forms.forEach((form) => {
    const controls = Array.from(form.querySelectorAll("input, select, textarea"));

    const ensureTooltip = (el) => {
      const message = el.validationMessage || "Please check this field.";
      el.setAttribute("data-bs-toggle", "tooltip");
      el.setAttribute("data-bs-placement", "top");
      el.setAttribute("data-bs-title", message);

      if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
        const existing = bootstrap.Tooltip.getInstance(el);
        if (existing) existing.setContent({ ".tooltip-inner": message });
        else new bootstrap.Tooltip(el, { trigger: "manual" });
      }
    };

    const hideTooltip = (el) => {
      if (typeof bootstrap === "undefined" || !bootstrap.Tooltip) return;
      const instance = bootstrap.Tooltip.getInstance(el);
      if (instance) instance.hide();
    };

    controls.forEach((el) => {
      el.addEventListener("input", () => {
        if (el.checkValidity()) hideTooltip(el);
      });

      el.addEventListener("blur", () => {
        if (!el.checkValidity()) {
          ensureTooltip(el);
          const instance = typeof bootstrap !== "undefined" ? bootstrap.Tooltip.getInstance(el) : null;
          if (instance) instance.show();
        } else {
          hideTooltip(el);
        }
      });
    });

    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();

        const firstInvalid = controls.find((el) => !el.checkValidity());
        if (firstInvalid) {
          ensureTooltip(firstInvalid);
          firstInvalid.focus({ preventScroll: false });
          const instance = typeof bootstrap !== "undefined" ? bootstrap.Tooltip.getInstance(firstInvalid) : null;
          if (instance) instance.show();
        }
      }

      form.classList.add("was-validated");
    });
  });
}

function initGallery() {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const grid = gallery.querySelector(".gallery-grid");
  const filters = gallery.querySelectorAll("[data-filter]");
  const items = Array.from(gallery.querySelectorAll(".gallery-item"));

  if (grid) {
    grid.classList.add("is-loading");
    window.setTimeout(() => grid.classList.remove("is-loading"), 500);
  }

  const applyFilter = (value) => {
    items.forEach((item) => {
      const cat = item.getAttribute("data-category") || "";
      const show = value === "all" || cat === value;
      item.classList.toggle("d-none", !show);
    });

    filters.forEach((btn) => btn.classList.toggle("active", (btn.getAttribute("data-filter") || "") === value));
  };

  filters.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      applyFilter(btn.getAttribute("data-filter") || "all");
    });
  });

  applyFilter("all");
}

function initPasswordToggles() {
  const buttons = document.querySelectorAll('[data-action="toggle-password"]');
  if (!buttons.length) return;

  const setState = (button, isVisible) => {
    button.setAttribute("aria-pressed", String(isVisible));
    button.setAttribute("data-password-state", isVisible ? "visible" : "hidden");
    const showIcon = button.querySelector(".password-icon-show");
    const hideIcon = button.querySelector(".password-icon-hide");
    if (showIcon && hideIcon) {
      showIcon.style.display = isVisible ? "none" : "inline-block";
      hideIcon.style.display = isVisible ? "inline-block" : "none";
    } else {
      button.textContent = isVisible ? "Hide" : "Show";
    }
  };

  buttons.forEach((button) => {
    const targetId = button.getAttribute("data-target") || "";
    const input = targetId ? document.getElementById(targetId) : null;
    if (!(input instanceof HTMLInputElement)) return;

    setState(button, input.type === "text");

    button.addEventListener("click", () => {
      const nextVisible = input.type === "password";
      input.type = nextVisible ? "text" : "password";
      setState(button, nextVisible);
      input.focus({ preventScroll: true });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPreferences();
  bindPreferenceControls();
  initActiveNav();
  initOffcanvasNav();
  initBackToTop();
  initFormValidation();
  initGallery();
  initPasswordToggles();
});
