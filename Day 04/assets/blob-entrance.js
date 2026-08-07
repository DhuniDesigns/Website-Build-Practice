/* ============================================================
   Blob load-in cleanup

   .footer-blobs starts with the "is-entering" class in the markup,
   which is what makes the staggered fall-in play on page load (see
   the .footer-blobs.is-entering .blob rule in styles.css). Once the
   sweep has visibly finished, this drops that class so .blob falls
   back to its own plain resting state (opacity:1, transform:none)
   instead of keeping "animation: blob-fall-in ..." assigned.

   That matters for the hover jiggle: if the fall-in animation stayed
   assigned to .blob indefinitely, every mouse-out would count as the
   animation-name property "changing back" to blob-fall-in and the
   browser would replay the whole fall-in on top of the jiggle
   settling. Dropping the class once entry is done avoids that.
   ============================================================ */

(function () {
  "use strict";

  var container = document.querySelector(".footer-blobs.is-entering");
  if (!container) return;

  var total = container.querySelectorAll(".blob").length;
  var finished = 0;
  var settled = false;

  function settle() {
    if (settled) return;
    settled = true;
    container.classList.remove("is-entering");
  }

  // Primary signal: every blob has finished its own float-in
  // (animationend bubbles, so one listener on the container catches
  // all of them — count rather than settle on the first, since
  // earlier-delayed blobs finish well before the later ones).
  container.addEventListener("animationend", function (event) {
    if (event.animationName !== "blob-fall-in") return;
    finished++;
    if (finished >= total) settle();
  });

  // Safety net — covers prefers-reduced-motion (animation never
  // plays, so animationend never fires) and any other edge case.
  window.setTimeout(settle, 2200);
})();
