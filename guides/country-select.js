(function () {
  const tabs = document.querySelectorAll(".country-tab");
  const panels = document.querySelectorAll(".country-panel");
  if (!tabs.length || !panels.length) return;

  const storageKey = "apostille-country";

  function select(country) {
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.country === country);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.country === country);
    });
    try {
      localStorage.setItem(storageKey, country);
    } catch (err) {
      // ignore storage errors (private browsing, etc.)
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => select(tab.dataset.country));
  });

  let saved = null;
  try {
    saved = localStorage.getItem(storageKey);
  } catch (err) {
    saved = null;
  }

  const initial = saved && document.querySelector(`.country-tab[data-country="${saved}"]`)
    ? saved
    : tabs[0].dataset.country;

  select(initial);
})();
