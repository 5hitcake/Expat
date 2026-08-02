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
    });
  });

  function updateProgress() {
    if (!progressEl) return;
    const done = checkboxes.filter((b) => b.checked).length;
    progressEl.textContent = `${done}/${checkboxes.length}`;
  }

  updateProgress();
});
