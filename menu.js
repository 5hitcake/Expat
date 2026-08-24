(function () {
  const toggle = document.getElementById("menu-toggle");
  const panel = document.getElementById("site-menu");
  const overlay = document.getElementById("site-menu-overlay");
  const closeBtn = document.getElementById("site-menu-close");
  if (!toggle || !panel || !overlay) return;

  function openMenu() {
    panel.classList.add("is-open");
    overlay.classList.add("is-open");
  }
  function closeMenu() {
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
  }

  toggle.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  panel.querySelectorAll("[data-progress]").forEach((el) => {
    const id = el.dataset.progress;
    try {
      const raw = localStorage.getItem(`guide-progress:${id}`);
      if (!raw) return;
      const { done, total } = JSON.parse(raw);
      if (!total) return;
      el.textContent = done >= total ? "✓" : `${done}/${total}`;
      if (done >= total) el.classList.add("site-menu-progress-done");
    } catch (err) {
      // ignore
    }
  });

  const signOutBtn = document.getElementById("site-menu-signout");
  if (signOutBtn) {
    const SESSION_KEY = "sb-lecciiekoeprcihwnquy-auth-token";
    let hasSession = false;
    try {
      hasSession = !!localStorage.getItem(SESSION_KEY);
    } catch (err) {
      hasSession = false;
    }
    if (hasSession) {
      signOutBtn.hidden = false;
      signOutBtn.addEventListener("click", () => {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch (err) {
          // ignore
        }
        location.href = panel.dataset.root + "board.html";
      });
    }
  }
})();
