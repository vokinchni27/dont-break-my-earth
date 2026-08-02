/* ============================================================
   EARTH MEMORY — config.js
   Everything you might want to tweak lives here.
   ============================================================ */

window.EM = window.EM || {};

EM.CONFIG = {

  archive: {
    dir: 'images/',                  // manifest paths are relative to Images/
    manifest: 'images/manifest.json' // regenerate with tools/update-manifest.ps1
  },

  /* fraction of the image hidden at the top (Google Earth toolbar)
     and bottom (attribution bar) of every full image. Fractions,
     not px, so it works whatever the capture resolution.
     Original files are never modified — the crop is runtime only.
     Set cropBottom to 0 to keep the coordinates / scale bar visible. */
  cropTop: 0.17,
  cropBottom: 0.05,

  ending: {
    scenesBeforeEnding: 30,   // space-presses before the final screen appears
    stripeUrl: '',            // ← your Stripe Payment Link, e.g. https://donate.stripe.com/xxxx
    line1: 'If these landscapes deserve more than your attention,',
    line2: 'help protect them.',
    note: 'the full amount is forwarded to associations working on the protection and restoration of ecosystems.',
    buttonLabel: '[ contribute ]'
  },

  webcam: {
    charset: '  ..··::--==++**##%%@@',
    fontSize: 10,             // px per character cell
    opacity: 0.8
  },

  timing: {
    slowFade: 4500,
    phraseHold: 3400,
    idleWhisper: 24000,       // "are you still looking?" after this much silence
    voidHold: 1600
  },

  /* text acts as a breath — short, rare, never explanatory */
  phrases: [
    'you are looking',
    'closer',
    'this is a forest',
    'this image is 18 km wide',
    'every pixel is real',
    'we stopped looking',
    'somewhere, it is raining',
    'this river does not know your name',
    'no one has ever stood here',
    'it is still there',
    'look again',
    'slower',
    'this is not a map',
    'you are here too',
    'it looked back',
    'nothing here is decoration',
    'the light you see is already gone'
  ],

  idlePhrase: 'are you still looking?'
};
