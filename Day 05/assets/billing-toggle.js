/* ============================================================
   Billing switch (Day 05 — Apex Pricing)

   A real ARIA "tabs" pattern, not just a click handler: click OR
   arrow-left/arrow-right/home/end move focus and selection between
   Monthly/Yearly, matching how a screen reader user expects a
   tablist to behave. Selecting a tab does two things visually —
   slides .switch-thumb behind the active label (measured off the
   button's own rendered width, so it stays correct if the switch
   is ever restyled/resized), and crossfades every card's price
   between its base monthly rate and a computed 20%-off yearly rate
   (data-monthly on each .price holds the source number — nothing
   hardcoded twice).
   ============================================================ */

(function () {
  const switchEl = document.querySelector(".switch");
  if (!switchEl) return;

  const thumb = switchEl.querySelector(".switch-thumb");
  const tabs = Array.from(switchEl.querySelectorAll(".switch-item"));
  const prices = Array.from(document.querySelectorAll(".price[data-monthly]"));
  const YEARLY_DISCOUNT = 0.8; // matches the "Save 20%" badge next to the switch

  function moveThumbTo(tab) {
    if (!thumb) return;
    const switchRect = switchEl.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const offset = tabRect.left - switchRect.left;
    thumb.style.width = tabRect.width + "px";
    thumb.style.transform = `translateX(${offset - 2}px)`;
  }

  function formatPrice(mode, base) {
    if (mode === "yearly") {
      return "$" + Math.round(base * YEARLY_DISCOUNT);
    }
    return "$" + base;
  }

  function updatePrices(mode) {
    prices.forEach((el) => {
      const base = Number(el.dataset.monthly);
      el.classList.add("is-swapping");
      window.setTimeout(() => {
        el.textContent = formatPrice(mode, base);
        el.classList.remove("is-swapping");
      }, 150);
    });
  }

  function activate(tab, { focus = false, animatePrices = true } = {}) {
    tabs.forEach((t) => {
      const isActive = t === tab;
      t.classList.toggle("is-active", isActive);
      t.setAttribute("aria-selected", String(isActive));
      t.tabIndex = isActive ? 0 : -1;
    });

    moveThumbTo(tab);

    if (animatePrices) {
      updatePrices(tab.dataset.mode);
    }

    if (focus) {
      tab.focus();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));

    tab.addEventListener("keydown", (event) => {
      let targetIndex = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        targetIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        targetIndex = 0;
      } else if (event.key === "End") {
        targetIndex = tabs.length - 1;
      }

      if (targetIndex !== null) {
        event.preventDefault();
        activate(tabs[targetIndex], { focus: true });
      }
    });
  });

  // Initial thumb placement — deferred a frame so layout/fonts have
  // settled and getBoundingClientRect reports real numbers.
  requestAnimationFrame(() => {
    const active = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
    moveThumbTo(active);
  });

  // Keep the thumb aligned if the switch reflows (e.g. font swap,
  // window resize crossing a breakpoint).
  window.addEventListener("resize", () => {
    const active = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
    moveThumbTo(active);
  });
})();
