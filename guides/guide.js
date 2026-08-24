function updateGuideProgress() {
  // Aggregate every checklist on the page into one done/total count for
  // the menu badge. Country-panel variants that aren't the selected one
  // (apostille) are skipped so the count reflects what the visitor
  // actually sees, not every possible country's items.
  let done = 0;
  let total = 0;
  document.querySelectorAll(".checklist").forEach((list) => {
    const panel = list.closest(".country-panel");
    if (panel && !panel.classList.contains("active")) return;
    const boxes = list.querySelectorAll('input[type="checkbox"]');
    total += boxes.length;
    boxes.forEach((b) => {
      if (b.checked) done++;
    });
  });
  const guideId = location.pathname.split("/").pop().replace(".html", "");
  try {
    localStorage.setItem(`guide-progress:${guideId}`, JSON.stringify({ done, total }));
  } catch (err) {
    // ignore storage errors (private browsing, etc.)
  }
}

document.querySelectorAll(".checklist").forEach((list) => {
  const key = list.dataset.storageKey;
  const checkboxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
  const phase = list.closest(".phase");
  const progressEl = phase ? phase.querySelector(".phase-progress") : null;

  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(key)) || [];
  } catch (err) {
    saved = [];
  }

  checkboxes.forEach((box, i) => {
    box.checked = saved.includes(i);
    box.addEventListener("change", () => {
      const checkedIndexes = checkboxes
        .map((b, idx) => (b.checked ? idx : null))
        .filter((idx) => idx !== null);
      localStorage.setItem(key, JSON.stringify(checkedIndexes));
      updateProgress();
      updateGuideProgress();
    });
  });

  function updateProgress() {
    if (!progressEl) return;
    const done = checkboxes.filter((b) => b.checked).length;
    progressEl.textContent = `${done}/${checkboxes.length}`;
  }

  updateProgress();
});

updateGuideProgress();
