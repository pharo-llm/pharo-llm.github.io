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

  // ===== TOKEN STUDIO =====
  const TOKEN_FILE_KEY = "tokenStudioFile";
  const DEFAULT_TOKEN = "376e7c52-72a5-41c7-b798-937e52ec91f2";
  const generatedToken = document.getElementById("generatedToken");
  const tokenFile = document.getElementById("tokenFile");
  const tokenStatus = document.getElementById("tokenStatus");
  const generateTokenBtn = document.getElementById("generateTokenBtn");
  const copyTokenBtn = document.getElementById("copyTokenBtn");

  function createToken() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function setStatus(message) {
    if (tokenStatus) {
      tokenStatus.textContent = message;
    }
  }

  function getCurrentToken() {
    return generatedToken?.textContent?.trim() || DEFAULT_TOKEN;
  }

  function appendTokenToFile(token) {
    if (!tokenFile) return;
    const tokens = tokenFile.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!tokens.includes(token)) {
      tokens.push(token);
    }

    tokenFile.value = tokens.join("\n");
    localStorage.setItem(TOKEN_FILE_KEY, tokenFile.value);
  }

  if (tokenFile) {
    const savedTokens = localStorage.getItem(TOKEN_FILE_KEY);
    tokenFile.value = savedTokens && savedTokens.trim() ? savedTokens : DEFAULT_TOKEN;
  }

  if (generateTokenBtn && generatedToken) {
    generateTokenBtn.addEventListener("click", () => {
      generatedToken.textContent = createToken();
      setStatus("New token generated. Copy it to add it to the website token file.");
    });
  }

  if (copyTokenBtn) {
    copyTokenBtn.addEventListener("click", async () => {
      const token = getCurrentToken();

      try {
        await navigator.clipboard.writeText(token);
        appendTokenToFile(token);
        setStatus("Token copied and added to tokens.txt successfully.");
      } catch (error) {
        appendTokenToFile(token);
        setStatus("Token added to tokens.txt, but clipboard access is not available in this browser.");
      }
    });
  }
})();
