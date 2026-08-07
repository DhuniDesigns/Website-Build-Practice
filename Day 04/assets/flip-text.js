/* ============================================================
   Flip Text — hover microinteraction for .footer-title
   Ported from Vengeance UI's "Flip Text" registry component
   (npx shadcn add https://www.vengenceui.com/r/flip-text.json)

   The source component is a React/Tailwind primitive that renders an
   infinitely-looping per-character 3D flip via a two-pseudo-element
   cross-fade (::before/::after rotated opposite ways around rotateX).
   This page has no React/Tailwind build step, so the mechanics are
   re-implemented here as plain DOM + CSS:

   - Same per-character split and the same stagger formula the source
     uses (sine-eased delay across the string: sin(i/total * PI/2)),
     so the "wave" timing feels identical.
   - Swapped from an infinite auto-loop to a one-shot animation gated
     on :hover in CSS (see styles.css), since the ask was a hover
     microinteraction, not a constantly-playing one.
   - Simplified from the two-pseudo-element cross-fade to a single
     rotateX keyframe per character (0deg -> -90deg -> 0deg). The
     source's cross-fade exists to swap in a *different* face; here
     the character flips to reveal itself again, so one face is enough
     and it naturally settles back to a normal, readable state instead
     of parking edge-on the way a one-shot of the original keyframes
     would.
   - Adds a screen-reader-only duplicate of the full sentence so the
     per-character markup (which is otherwise meaningless to a screen
     reader) can be hidden from assistive tech.
   ============================================================ */

(function () {
  "use strict";

  // Per-character flip duration must match the animation-duration set
  // in styles.css (.footer-title:hover .flip-char).
  var FLIP_DURATION = 0.6;
  // Max extra delay applied to the last character in the string —
  // this is what creates the left-to-right "wave" on hover.
  var STAGGER_SPREAD = 0.55;

  function renderLine(text, startIndex, totalChars) {
    var lineEl = document.createElement("span");
    lineEl.className = "flip-line";

    var words = text.split(" ");
    var globalIndex = startIndex;

    words.forEach(function (word, wordIndex) {
      var wordEl = document.createElement("span");
      wordEl.className = "flip-word";

      for (var i = 0; i < word.length; i++) {
        var charEl = document.createElement("span");
        charEl.className = "flip-char";
        charEl.textContent = word[i];

        var normalized = globalIndex / totalChars;
        var sineValue = Math.sin(normalized * (Math.PI / 2));
        var delay = sineValue * STAGGER_SPREAD;
        charEl.style.setProperty("--flip-delay", delay.toFixed(3) + "s");

        wordEl.appendChild(charEl);
        globalIndex++;
      }

      lineEl.appendChild(wordEl);

      if (wordIndex < words.length - 1) {
        lineEl.appendChild(document.createTextNode(" "));
        globalIndex++;
      }
    });

    return { el: lineEl, nextIndex: globalIndex };
  }

  function buildFlipHeading(el) {
    var line1 = (el.getAttribute("data-flip-line1") || "").trim();
    var line2 = (el.getAttribute("data-flip-line2") || "").trim();
    if (!line1 && !line2) return;

    var totalChars = (line1 + line2).replace(/ /g, "").length;

    var srOnly = document.createElement("span");
    srOnly.className = "sr-only";
    srOnly.textContent = line1 + (line1 && line2 ? " " : "") + line2;

    var visual = document.createElement("span");
    visual.className = "flip-visual";
    visual.setAttribute("aria-hidden", "true");

    var first = renderLine(line1, 0, totalChars);
    visual.appendChild(first.el);

    if (line2) {
      var second = renderLine(line2, first.nextIndex, totalChars);
      visual.appendChild(second.el);
    }

    el.textContent = "";
    el.style.setProperty("--flip-duration", FLIP_DURATION + "s");
    el.appendChild(srOnly);
    el.appendChild(visual);
  }

  document.querySelectorAll("[data-flip-line1]").forEach(buildFlipHeading);
})();
