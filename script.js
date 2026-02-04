(function () {
  const root = document.documentElement;

  // ===== YEAR =====
  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  // ===== THEME (works with multiple buttons) =====
  const themeBtns = document.querySelectorAll("#themeBtn");

  const savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);
  updateThemeIcons(savedTheme);

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeIcons(theme);
  }

  function updateThemeIcons(theme) {
    themeBtns.forEach((btn) => {
      btn.textContent = theme === "light" ? "🌙" : "☀️";
    });
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "light";
      setTheme(current === "dark" ? "light" : "dark");
    });
  });

  // ===== MOBILE NAV =====
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("navMenu");

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close when clicking a link
    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("is-open")) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });
  }

  // ===== DEMO FORM =====
  window.fakeSubmit = function (event) {
    event.preventDefault();
    const note = document.getElementById("formNote");
    if (note) {
      note.textContent =
        "✅ Form captured (demo). Wire this to your backend to send emails.";
    }
    event.target.reset();
    return false;
  };
})();
