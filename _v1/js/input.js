/* ============================================================
   EARTH MEMORY — input.js
   Keyboard and mouse. No buttons, no menus.
     space  → explore (random composition)
     ←  →   → previous / next composition preset
     1…0    → jump to preset 1…10
     click on void  → reveal a fragment
     click on image → make it disappear
     esc    → hide interface          c → signal    s → sound
   ============================================================ */

EM.Input = {
  init() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        EM.Main.explore();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        EM.Main.preset(() => EM.Compo.cycle(1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        EM.Main.preset(() => EM.Compo.cycle(-1));
      } else if (/^[0-9]$/.test(e.key)) {
        const n = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
        EM.Main.preset(() => EM.Compo.go(n));
      } else if (e.key === 'Escape') {
        document.body.classList.toggle('ui-hidden');
      } else if (e.key === 'c' || e.key === 'C') {
        EM.Webcam.toggle();
      } else if (e.key === 's' || e.key === 'S') {
        EM.Sound.toggle();
      }
    });

    document.getElementById('stage').addEventListener('click', (e) => {
      EM.Main.revealAt(e.clientX, e.clientY);
    });

    document.getElementById('intro').addEventListener('click', () => EM.Main.explore());
  }
};
