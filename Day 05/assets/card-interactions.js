/* ============================================================
   Card interactions (Day 05 — Apex Pricing)

   There's no checkout to send "Start free trial" to yet, so instead
   of a dead button it surfaces a small toast confirming which plan
   was picked — honest placeholder feedback rather than a silent
   click. role="status"/aria-live="polite" on the toast (set in the
   markup) means screen readers announce it without interrupting.
   ============================================================ */

(function () {
  const toast = document.querySelector("[data-toast]");
  const buttons = document.querySelectorAll(".card-btn");
  if (!toast || !buttons.length) return;

  let hideTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");

    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const planName = button.closest(".pricing-card").querySelector("h3").textContent;
      showToast(`${planName} trial started — check your inbox to finish setting up.`);
    });
  });
})();
