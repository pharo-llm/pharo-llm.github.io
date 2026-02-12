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

  // ===== TOKEN STUDIO MINIMAL =====

  const genBtn = document.getElementById("generateTokenBtn");
  const addBtn = document.getElementById("addTokenBtn");
  const tokenView = document.getElementById("generatedToken");
  const status = document.getElementById("tokenStatus");

  let tokensFileHandle = null;

  // Generate UUID
  genBtn?.addEventListener("click", () => {
    const token = crypto.randomUUID();
    tokenView.textContent = token;
    status.textContent = "Token generated.";
  });

  // Choose file once
  async function getFileHandle() {
    if (tokensFileHandle) return tokensFileHandle;

    tokensFileHandle = await window.showSaveFilePicker({
      suggestedName: "tokens.txt",
      types: [
        {
          description: "Text file",
          accept: { "text/plain": [".txt"] },
        },
      ],
    });

    return tokensFileHandle;
  }

  // Add token to file
  addBtn?.addEventListener("click", async () => {
    const token = tokenView.textContent.trim();

    if (!token || token === "—") {
      status.textContent = "Generate a token first.";
      return;
    }

    try {
      const handle = await getFileHandle();
      const file = await handle.getFile();
      const oldText = await file.text();

      const writable = await handle.createWritable();
      await writable.write(oldText + token + "\n");
      await writable.close();

      status.textContent = "Token added to file.";
    } catch (err) {
      status.textContent = "File write canceled or unsupported.";
    }
  });

})();
