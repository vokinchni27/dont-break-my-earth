/* ============================================================
   EARTH — js/content.js
   ------------------------------------------------------------
   Les textes publiés du mini-CMS. Les fragments rejoignent la
   matière vivante ; les contenus longs restent dans un feuillet
   discret, sans transformer l'œuvre en site éditorial classique.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Content = {
    items: [],
    el: null,

    async charger() {
      if (!/^https?:$/.test(location.protocol)) return [];
      try {
        const data = await EARTH.Supa.api('/api/content');
        this.items = Array.isArray(data.content) ? data.content : [];
        /* toute ligne dont la cle correspond a une cle de textes.js
           remplace le texte statique : c'est le CMS demande */
        EARTH.T.surcharger(this.items);
        const fragments = this.items
          .filter(item => item.type === 'fragment' && item.value)
          .map(item => item.value);
        EARTH.CONFIG.texte.fragments = Array.from(new Set(
          EARTH.CONFIG.texte.fragments.concat(fragments)
        ));
      } catch (e) {
        console.warn('[EARTH] contenus distants indisponibles', e.message);
      }
      return this.items;
    },

    init(el) {
      this.el = el;
      const longs = this.items.filter(item => item.type !== 'fragment');
      if (!longs.length) return this;

      const bouton = document.createElement('button');
      bouton.className = 'contenu-invite';
      bouton.type = 'button';
      bouton.textContent = EARTH.T('contenu.invite');
      bouton.setAttribute('aria-expanded', 'false');

      const feuille = document.createElement('section');
      feuille.className = 'contenu-feuille';
      feuille.setAttribute('aria-hidden', 'true');
      feuille.setAttribute('aria-label', EARTH.T('contenu.aria'));

      const fermer = document.createElement('button');
      fermer.className = 'contenu-fermer';
      fermer.type = 'button';
      fermer.textContent = EARTH.T('contenu.fermer');
      feuille.appendChild(fermer);

      longs.forEach(item => {
        const article = document.createElement('article');
        article.className = 'contenu-bloc contenu-bloc--' + item.type;
        if (item.title) {
          const titre = document.createElement('h2');
          titre.textContent = item.title;
          article.appendChild(titre);
        }
        const texte = document.createElement(item.type === 'quote' ? 'blockquote' : 'p');
        texte.textContent = item.value;
        article.appendChild(texte);
        feuille.appendChild(article);
      });

      const basculer = ouvert => {
        feuille.classList.toggle('visible', ouvert);
        feuille.setAttribute('aria-hidden', String(!ouvert));
        bouton.setAttribute('aria-expanded', String(ouvert));
        document.body.classList.toggle('contenu-ouvert', ouvert);
      };
      bouton.onclick = () => basculer(true);
      fermer.onclick = () => basculer(false);
      feuille.addEventListener('click', e => { if (e.target === feuille) basculer(false); });
      window.addEventListener('keydown', e => { if (e.key === 'Escape') basculer(false); });

      el.appendChild(bouton);
      el.appendChild(feuille);
      return this;
    }
  };

  EARTH.Content = Content;
})(window.EARTH = window.EARTH || {});
