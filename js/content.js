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

    /* Le feuillet vient de `contenu.blocs`, donc du bac à sable.
       Si le mini-CMS publie des contenus longs, ce sont eux qui
       gagnent : on les traduit dans la même clé, sans les garder,
       pour qu'il n'existe qu'UNE source à l'écran. */
    adopterContenusDistants() {
      const longs = this.items.filter(item => item.type !== 'fragment' && item.value);
      if (!longs.length) return;
      EARTH.T.poser('contenu.blocs', longs.map(item => [item.title || '', item.value]));
    },

    blocs() {
      const liste = EARTH.T('contenu.blocs');
      return (Array.isArray(liste) ? liste : [])
        .map(b => Array.isArray(b) ? b : ['', String(b)])
        .filter(b => b[0] || b[1]);
    },

    init(el) {
      this.el = el;
      this.adopterContenusDistants();
      if (!this.blocs().length) return this;

      const bouton = document.createElement('button');
      bouton.className = 'contenu-invite';
      bouton.type = 'button';
      bouton.setAttribute('data-t', 'contenu.invite');
      bouton.setAttribute('aria-expanded', 'false');

      const feuille = document.createElement('section');
      feuille.className = 'contenu-feuille';
      /* on y lit un texte long : la molette doit y defiler */
      feuille.setAttribute('data-interface', 'feuillet');
      feuille.setAttribute('aria-hidden', 'true');
      feuille.setAttribute('data-t-aria', 'contenu.aria');

      const fermer = document.createElement('button');
      fermer.className = 'contenu-fermer';
      fermer.type = 'button';
      fermer.setAttribute('data-t', 'contenu.fermer');
      feuille.appendChild(fermer);

      /* redessiné à chaque réécriture : le bac à sable doit se voir */
      const peindre = () => {
        feuille.querySelectorAll('.contenu-bloc').forEach(n => n.remove());
        this.blocs().forEach(([titre, valeur]) => {
          const article = document.createElement('article');
          article.className = 'contenu-bloc';
          if (titre) {
            const h = document.createElement('h2');
            h.textContent = titre;
            article.appendChild(h);
          }
          const p = document.createElement('p');
          p.textContent = valeur;
          article.appendChild(p);
          feuille.appendChild(article);
        });
      };
      peindre();
      EARTH.T.surChangement(peindre);

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
      EARTH.T.hydrater(el);
      return this;
    }
  };

  EARTH.Content = Content;
})(window.EARTH = window.EARTH || {});
