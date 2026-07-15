import { MESSAGES, FALLBACK_MESSAGE, LETTER_STYLE_CLASSES, PARTICLE_SHAPES } from './constants.js';
import { shuffleArray } from './utils.js';

const LETTERS = 'MAINTENANCE';

/**
 * Picks and inserts a random maintenance message.
 */
export function setupMessage() {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.innerHTML = MESSAGES[Math.floor(Math.random() * MESSAGES.length)] || FALLBACK_MESSAGE;
  }
}

/**
 * Generates the animated MAINTENANCE letters inside the container.
 * @returns {HTMLElement[]|undefined}
 */
export function createLetters() {
  const container = document.getElementById('letters');
  if (!container) return;

  container.innerHTML = LETTERS.split('')
    .map(
      (char) =>
        `<span class="letter" data-letter="${char}">` +
        `<span class="color">${char}</span>` +
        `<span class="mono"><span>${char}</span></span>` +
        `</span>`,
    )
    .join('');

  return Array.from(container.querySelectorAll('.letter'));
}

/**
 * Applies a random style class to each letter.
 * @param {HTMLElement[]} letterEls
 */
export function applyRandomLetterStyles(letterEls) {
  const shuffled = shuffleArray(LETTER_STYLE_CLASSES);

  letterEls.forEach((letter, i) => {
    letter.className = 'letter';
    if (shuffled[i]) letter.classList.add(shuffled[i]);
  });
}

/**
 * Generates floating decorative particles.
 */
export function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 24; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = PARTICLE_SHAPES[i % PARTICLE_SHAPES.length];
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.fontSize = `${0.6 + Math.random() * 1.4}rem`;
    p.style.opacity = String(0.15 + Math.random() * 0.5);
    container.appendChild(p);
  }
}
