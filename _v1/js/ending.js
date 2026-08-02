/* ============================================================
   EARTH MEMORY — ending.js
   The last screen of the piece. Very sober. No drama.
   One gesture only : a free-amount donation, via a Stripe
   Payment Link (set it in js/config.js → ending.stripeUrl).
   ============================================================ */

EM.Ending = {
  shown: false,

  show() {
    if (this.shown) return;
    this.shown = true;

    EM.Webcam.stop();
    EM.Stage.clear('fade');

    const cfg = EM.CONFIG.ending;
    const root = document.getElementById('ending');
    root.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'ending-inner';

    const p1 = document.createElement('p');
    p1.textContent = cfg.line1;
    const p2 = document.createElement('p');
    p2.textContent = cfg.line2;

    const btn = document.createElement('button');
    btn.className = 'donate';
    btn.textContent = cfg.buttonLabel;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cfg.stripeUrl) {
        window.open(cfg.stripeUrl, '_blank', 'noopener');
      } else {
        btn.textContent = '[ set your stripe payment link in js/config.js ]';
      }
    });

    const note = document.createElement('p');
    note.className = 'ending-note';
    note.textContent = cfg.note;

    box.append(p1, p2, btn, note);
    root.appendChild(box);
    root.classList.remove('hidden');
    requestAnimationFrame(() => root.classList.add('on'));
  }
};
