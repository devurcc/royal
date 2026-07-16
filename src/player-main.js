import './styles/player.css';
import anime from 'animejs';

import { setupMessage, createLetters, applyRandomLetterStyles, createParticles } from './js/ui.js';
import { startIntroAnimations } from './js/player-animations.js';
import { setupPlayer, loadPlaylist } from './js/player-v2.js';

function run() {
  setupMessage();
  const letterEls = createLetters();
  if (letterEls) applyRandomLetterStyles(letterEls);
  createParticles();

  const start = () => {
    loadPlaylist().then(() => {
      document.body.style.opacity = '';
      anime({
        targets: 'body',
        opacity: [0, 1],
        duration: 700,
        easing: 'linear',
        complete: () => {
          startIntroAnimations();
          if (letterEls) setupPlayer(letterEls);
        },
      });
    });
  };

  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start);
  }
}

run();
