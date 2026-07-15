import anime from 'animejs';

/** @type {import('animejs').AnimeInstance|null} */
let letterIdle = null;

/** @type {import('animejs').AnimeInstance|null} */
let letterJitter = null;

/** @type {import('animejs').AnimeInstance|null} */
let playerBeat = null;

/** @type {import('animejs').AnimeInstance|null} */
let playerGlow = null;

/** @type {import('animejs').AnimeInstance|null} */
let playerAmbient = null;

/**
 * Runs the intro timeline and background idle animations.
 */
export function startIntroAnimations() {
  const tl = anime.timeline({ easing: 'easeOutExpo' });

  tl.add({ targets: '.bg-lines', opacity: [0, 1], scale: [1.1, 1], rotate: [5, 0], duration: 1400 })
    .add(
      {
        targets: '.plush-wrap',
        translateY: [120, 0],
        opacity: [0, 1],
        rotate: [-15, 0],
        duration: 1100,
      },
      '-=900',
    )
    .add(
      {
        targets: '.letter',
        translateY: [-60, 0],
        scale: [0.88, 1],
        opacity: [0, 1],
        delay: anime.stagger(80),
        duration: 900,
        easing: 'easeOutElastic(1, .55)',
      },
      '-=600',
    )
    .add({ targets: '#message', opacity: [0, 1], translateY: [40, 0], duration: 900 }, '-=400')
    .add(
      {
        targets: '.star',
        scale: [0, 1],
        rotate: [0, 360],
        opacity: [0, 1],
        delay: anime.stagger(120),
        duration: 700,
        easing: 'easeOutBack',
      },
      '-=700',
    );

  anime({
    targets: '.plush-wrap',
    translateY: [0, -14],
    rotate: [0, 2],
    duration: 2600,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  letterIdle = anime({
    targets: '.letter',
    translateY: [0, -4],
    scale: [1, 1.01],
    rotate: [-1, 1],
    duration: 1600,
    delay: anime.stagger(80),
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  letterJitter = anime({
    targets: '.letter',
    translateY: () => anime.random(-15, 15) / 10,
    rotate: () => anime.random(-15, 15) / 10,
    scale: () => anime.random(995, 1005) / 1000,
    duration: () => anime.random(120, 260),
    delay: anime.stagger(40, { from: 'random' }),
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutQuad',
  });

  anime({
    targets: '.bg-burst',
    opacity: [0.2, 0.45],
    scale: [1, 1.08],
    duration: 3200,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  anime({
    targets: '.star',
    scale: [1, 1.25],
    rotate: [0, 30],
    duration: 1500,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    delay: anime.stagger(300),
  });

  anime({
    targets: '.particle',
    translateY: [-30, 30],
    translateX: [-20, 20],
    rotate: [0, 180],
    opacity: [0.1, 0.6],
    duration: () => anime.random(4000, 7000),
    delay: anime.stagger(200),
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  let rafId;
  document.addEventListener('mousemove', (event) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = (event.clientY / window.innerHeight - 0.5) * 8;
      anime({ targets: '.letters', rotateY: x, rotateX: -y, duration: 400, easing: 'easeOutQuad' });
      rafId = null;
    });
  });
}

/**
 * Starts the high-energy animations used when a track is playing.
 */
export function startPlayerAnimations() {
  if (playerBeat?.play) {
    playerBeat.play();
  } else {
    playerBeat = anime({
      targets: '.plush-wrap',
      scale: [1, 1.04],
      translateY: [0, -10],
      duration: 520,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    });
  }

  if (playerGlow?.play) {
    playerGlow.play();
  } else {
    playerGlow = anime({
      targets: '.plush',
      filter: [
        'drop-shadow(0 0 28px rgba(216,17,17,0.45))',
        'drop-shadow(0 0 48px rgba(216,17,17,0.85))',
        'drop-shadow(0 0 28px rgba(216,17,17,0.45))',
      ],
      duration: 1040,
      loop: true,
      easing: 'easeInOutSine',
    });
  }

  anime({
    targets: '.bg-burst',
    opacity: [0.35, 0.7],
    scale: [1, 1.15],
    duration: 1040,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  if (playerAmbient?.play) {
    playerAmbient.play();
  } else {
    playerAmbient = anime({
      targets: '.letter',
      translateY: () => anime.random(-70, 70) / 10,
      rotate: () => anime.random(-55, 55) / 10,
      scale: () => anime.random(1002, 1015) / 1000,
      duration: () => anime.random(220, 420),
      delay: anime.stagger(50, { from: 'center' }),
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    });
  }
}

/**
 * Stops player animations and restores idle state.
 * @param {HTMLElement[]} letterEls
 */
export function stopPlayerAnimations(letterEls) {
  playerBeat?.pause();
  playerGlow?.pause();
  playerAmbient?.pause();

  letterIdle?.play();
  letterJitter?.play();

  letterEls.forEach((letter) => {
    letter.querySelector('.mono').style.clipPath = 'inset(0 0 0 0)';
  });

  anime({
    targets: '.letter',
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1,
    scale: 1,
    duration: 400,
    easing: 'easeOutQuad',
    complete: () => {
      letterEls.forEach((letter) => {
        letter.style.transform = '';
        letter.querySelector('.color').style.transform = '';
        letter.querySelector('.mono').style.transform = '';
      });
    },
  });

  anime({
    targets: '.plush',
    filter: 'drop-shadow(0 0 28px rgba(216,17,17,0.45))',
    duration: 400,
    easing: 'easeOutQuad',
  });

  anime({
    targets: '.plush-wrap',
    translateY: [0, -14],
    rotate: [0, 2],
    scale: 1,
    duration: 2600,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  anime({
    targets: '.bg-burst',
    opacity: [0.2, 0.45],
    scale: [1, 1.08],
    duration: 3200,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });
}
