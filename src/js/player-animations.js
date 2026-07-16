import anime from 'animejs';

/** @type {import('animejs').AnimeInstance|null} */
let letterIdle = null;

/** @type {import('animejs').AnimeInstance|null} */
let letterJitter = null;

/** @type {import('animejs').AnimeInstance|null} */
let titleMarquee = null;

/** @type {import('animejs').AnimeInstance|null} */
let starIdle = null;

/**
 * Splits #message into per-line spans so they can be animated separately.
 */
function splitMessageIntoLines() {
  const messageEl = document.getElementById('message');
  if (!messageEl) return [];

  const existingLines = messageEl.querySelectorAll('.message-line');
  if (existingLines.length > 0) return Array.from(existingLines);

  const raw = messageEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  messageEl.innerHTML = lines.map((line) => `<span class="message-line">${line}</span>`).join('');

  return Array.from(messageEl.querySelectorAll('.message-line'));
}

/**
 * Starts a horizontal marquee on the player title if its content overflows.
 * @param {HTMLElement} el
 */
function startMarquee(el) {
  if (!el) return null;

  const wrap = el.parentElement;
  if (!wrap) return null;

  const overflow = el.scrollWidth - wrap.clientWidth;
  if (overflow <= 0) return null;

  if (titleMarquee?.play) {
    titleMarquee.play();
    return titleMarquee;
  }

  titleMarquee = anime({
    targets: el,
    translateX: [0, -overflow],
    duration: 4000 + overflow * 12,
    easing: 'linear',
    direction: 'alternate',
    loop: true,
    autoplay: true,
  });

  return titleMarquee;
}

/**
 * Stops the title marquee and resets the element position.
 * @param {HTMLElement} el
 */
function stopMarquee(el) {
  if (titleMarquee?.pause) titleMarquee.pause();
  if (el) anime({ targets: el, translateX: 0, duration: 300, easing: 'easeOutQuad' });
}

/**
 * Updates the visible track title and handles the link state.
 * @param {string} title
 * @param {string} [href]
 */
export function updateTrackTitle(title, href) {
  const titleText = document.getElementById('playerTitleText');
  const titleLink = document.getElementById('playerTitle');

  const safeTitle = title || 'Click plush to play';
  if (titleText) titleText.textContent = safeTitle;

  if (href) {
    titleLink?.setAttribute('href', href);
    titleLink?.classList.add('has-title');
  } else {
    titleLink?.setAttribute('href', '#');
    titleLink?.classList.remove('has-title');
  }

  if (titleText) {
    stopMarquee(titleText);
    requestAnimationFrame(() => {
      startMarquee(titleText);
    });
  }
}

/**
 * Updates the CSS scale of the player shape wrapper based on available viewport
 * height. Keeps the player UI proportional on desktop and mobile.
 */
export function updatePlayerShapeScale() {
  const shape = document.getElementById('playerShape');
  if (!shape || !document.body.classList.contains('player-mode')) {
    shape?.style.setProperty('--player-scale', '1');
    return;
  }

  const isMobile = window.innerWidth <= 600;
  const baseHeight = isMobile ? 200 : 260;
  const topOffset = isMobile ? 12 : 14;
  const minScale = isMobile ? 0.88 : 0.78;
  const availableHeight = window.innerHeight - topOffset;
  const scale = Math.min(1, Math.max(minScale, availableHeight / baseHeight));

  shape.style.setProperty('--player-scale', String(scale));
}

/**
 * Animates the player UI into the "playing" layout.
 */
export function enterPlayerLayout() {
  const shape = document.getElementById('playerShape');
  const shapePoly = shape?.querySelector('.player-shape__poly');
  const titleText = document.getElementById('playerTitleText');
  const body = document.body;

  body.classList.add('player-mode');

  letterIdle?.pause();
  letterJitter?.pause();
  starIdle?.pause();
  stopMarquee(titleText);

  splitMessageIntoLines();

  const tl = anime.timeline({ easing: 'easeOutExpo' });

  tl.add({
    targets: '.message-line',
    translateX: [0, '100vw'],
    opacity: [1, 0],
    delay: anime.stagger(100),
    duration: 700,
    easing: 'easeInExpo',
  })
    .add(
      {
        targets: '.player-shape__content',
        opacity: [1, 0],
        scale: [1, 0.92],
        duration: 400,
        easing: 'easeInQuad',
      },
      0,
    )
    .add(
      {
        targets: '.video-overlay-gradient',
        opacity: [0, 1],
        duration: 600,
        easing: 'linear',
      },
      0,
    )
    .add(
      {
        targets: shape,
        opacity: [1, 1],
        rotateX: [55, 0],
        rotateY: [-45, 0],
        skewX: [-25, -10],
        scale: [0.15, 1],
        translateX: ['-60%', 0],
        translateY: ['-80%', 0],
        duration: 1100,
        easing: 'easeOutExpo',
      },
      150,
    )
    .add(
      {
        targets: shapePoly,
        points: [
          '0,200 0,200 0,200 0,200 0,200',
          '0,200 0,0 0,0 0,200 0,200',
          '0,200 0,0 760,0 0,200 0,200',
          '0,200 0,0 760,0 700,200 0,200',
          '0,200 0,0 760,0 760,140 0,200',
          '0,200 0,0 760,0 760,200 0,200',
        ],
        duration: 1000,
        easing: 'easeOutExpo',
      },
      150,
    )
    .add(
      {
        targets: '.player-shape__content',
        opacity: [0, 1],
        scale: [0.85, 1],
        duration: 500,
        easing: 'easeOutExpo',
      },
      850,
    )
    .add(
      {
        targets: '.letter',
        opacity: [0, 1],
        translateY: [-30, 0],
        scale: [0.8, 1],
        delay: anime.stagger(60),
        duration: 500,
        easing: 'easeOutBack',
      },
      900,
    )
    .add(
      {
        targets: '.player-title',
        opacity: [0, 1],
        translateX: [-40, 0],
        duration: 500,
        easing: 'easeOutExpo',
      },
      1050,
    )
    .add(
      {
        targets: '.player-btn',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(70),
        duration: 400,
        easing: 'easeOutBack',
      },
      1150,
    )
    .add(
      {
        targets: '.plush-wrap',
        opacity: [0, 1],
        translateX: [60, 0],
        translateY: [80, 0],
        scale: [0.35, 1],
        rotate: [-15, 0],
        duration: 800,
        easing: 'easeOutBack',
      },
      1200,
    )
    .finished.then(() => {
      window.dispatchEvent(new CustomEvent('maintenance:layoutchange'));
      if (titleText) startMarquee(titleText);
      anime({
        targets: '.message',
        opacity: 0,
        duration: 400,
        easing: 'linear',
      });
      updatePlayerShapeScale();
    });
}

/**
 * Animates the player UI back to the idle layout.
 */
export function exitPlayerLayout() {
  const shape = document.getElementById('playerShape');
  const shapePoly = shape?.querySelector('.player-shape__poly');
  const titleText = document.getElementById('playerTitleText');
  const body = document.body;

  stopMarquee(titleText);
  window.dispatchEvent(new CustomEvent('maintenance:layoutchange'));

  const tl = anime.timeline({ easing: 'easeOutExpo' });

  tl.add({
    targets: '.plush-wrap',
    opacity: [1, 0],
    translateX: [0, 60],
    translateY: [0, 80],
    scale: [1, 0.35],
    rotate: [0, -15],
    duration: 500,
    easing: 'easeInBack',
  })
    .add(
      {
        targets: '.player-btn',
        opacity: [1, 0],
        translateY: [0, 20],
        delay: anime.stagger(50),
        duration: 300,
        easing: 'easeInExpo',
      },
      100,
    )
    .add(
      {
        targets: '.player-title',
        opacity: [1, 0],
        translateX: [0, -40],
        duration: 350,
        easing: 'easeInExpo',
      },
      150,
    )
    .add(
      {
        targets: '.letter',
        opacity: [1, 0],
        translateY: [0, -20],
        scale: [1, 0.85],
        delay: anime.stagger(40),
        duration: 350,
        easing: 'easeInExpo',
      },
      200,
    )
    .add(
      {
        targets: '.player-shape__content',
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 350,
        easing: 'easeInQuad',
      },
      300,
    )
    .add(
      {
        targets: shapePoly,
        points: [
          '0,200 0,0 760,0 760,200 0,200',
          '0,200 0,0 760,0 760,140 0,200',
          '0,200 0,0 760,0 700,200 0,200',
          '0,200 0,0 760,0 0,200 0,200',
          '0,200 0,0 0,0 0,200 0,200',
          '0,200 0,200 0,200 0,200 0,200',
        ],
        duration: 700,
        easing: 'easeInExpo',
      },
      150,
    )
    .add(
      {
        targets: shape,
        rotateX: [0, 55],
        rotateY: [0, -45],
        skewX: [-10, -25],
        scale: [1, 0.15],
        translateX: [0, '-60%'],
        translateY: [0, '-80%'],
        opacity: [1, 1],
        duration: 800,
        easing: 'easeInExpo',
      },
      400,
    )
    .add(
      {
        targets: '.video-overlay-gradient',
        opacity: 0,
        duration: 500,
        easing: 'linear',
      },
      600,
    )
    .add(
      {
        targets: '.message-line',
        translateX: ['100vw', 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 700,
        easing: 'easeOutExpo',
      },
      700,
    )
    .add(
      {
        targets: '.player-shape__content',
        opacity: [0, 1],
        scale: [0.92, 1],
        duration: 500,
        easing: 'easeOutQuad',
      },
      900,
    )
    .finished.then(() => {
      body.classList.remove('player-mode');
      if (shapePoly) shapePoly.setAttribute('points', '0,200 0,200 0,200 0,200 0,200');
      window.dispatchEvent(new CustomEvent('maintenance:layoutchange'));
      letterIdle?.play();
      letterJitter?.play();
      starIdle?.play();
      anime({
        targets: '.message',
        opacity: 1,
        duration: 500,
        easing: 'linear',
      });
    });
}

/**
 * Brief shape pulse used when switching tracks while already playing.
 */
export function pulsePlayerShape() {
  const shape = document.getElementById('playerShape');
  if (!shape) return;

  anime({
    targets: shape,
    scaleX: [1, 1.02, 1],
    skewX: [-10, -6, -10],
    duration: 380,
    easing: 'easeOutSine',
  });
}

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
    targets: '.letters .letter',
    translateY: [0, -4],
    scale: [1, 1.01],
    rotate: [-1, 1],
    duration: 1600,
    delay: anime.stagger(80),
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    autoplay: false,
  });

  letterJitter = anime({
    targets: '.letters .letter',
    translateY: () => anime.random(-15, 15) / 10,
    rotate: () => anime.random(-15, 15) / 10,
    scale: () => anime.random(995, 1005) / 1000,
    duration: () => anime.random(120, 260),
    delay: anime.stagger(40, { from: 'random' }),
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutQuad',
    autoplay: false,
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

  starIdle = anime({
    targets: '.star',
    scale: [1, 1.25],
    rotate: [0, 30],
    duration: 1500,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    delay: anime.stagger(300),
    autoplay: false,
  });

  letterIdle?.play();
  letterJitter?.play();
  starIdle?.play();

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
    if (document.body.classList.contains('player-mode')) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = (event.clientY / window.innerHeight - 0.5) * 8;
      anime({ targets: '.stage .letters', rotateY: x, rotateX: -y, duration: 400, easing: 'easeOutQuad' });
      rafId = null;
    });
  });
}

/**
 * Starts the high-energy animations used when a track is playing.
 */
export function startPlayerAnimations() {
  letterIdle?.pause();
  letterJitter?.pause();

  anime({
    targets: '.bg-burst',
    opacity: [0.35, 0.7],
    scale: [1, 1.15],
    duration: 1040,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  anime({
    targets: '.star',
    translateX: () => anime.random(-90, 90) / 10,
    translateY: () => anime.random(-90, 90) / 10,
    scale: () => anime.random(105, 145) / 100,
    rotate: () => anime.random(-100, 100) / 10,
    duration: () => anime.random(240, 480),
    delay: anime.stagger(60, { from: 'random' }),
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });

  starIdle?.pause();
}

/**
 * Stops player animations and restores idle state.
 * @param {HTMLElement[]} letterEls
 */
export function stopPlayerAnimations(letterEls) {
  if (!document.body.classList.contains('player-mode')) {
    letterIdle?.play();
    letterJitter?.play();
    starIdle?.play();
  }

  letterEls.forEach((letter) => {
    letter.querySelector('.mono').style.clipPath = 'inset(0 0 0 0)';
  });

  if (!document.body.classList.contains('player-mode')) {
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
  }

  if (!document.body.classList.contains('player-mode')) {
    anime({
      targets: '.plush',
      filter: 'drop-shadow(0 0 28px rgba(216,17,17,0.45))',
      duration: 400,
      easing: 'easeOutQuad',
    });
  }

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
