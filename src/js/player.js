import { DEFAULT_PLAYLIST } from './constants.js';
import { getPlayedIds, setPlayedIds, shuffleArray } from './utils.js';
import { startPlayerAnimations, stopPlayerAnimations } from './animations.js';
import { loadYouTubeAPI } from './youtube.js';

const PLAYLIST_URL = 'https://gist.githubusercontent.com/devurcc/0e781b8eb7829d0fc73bcbfc0d9ae2a2/raw/maintenance_playlist.json';

let isPlaying = false;
let playlistReady = false;
let playlistPromise = null;
let playlist = DEFAULT_PLAYLIST.slice();

/**
 * Initializes the YouTube-based audio/video player and its UI bindings.
 * @param {HTMLElement[]} letterEls
 */
export function setupPlayer(letterEls) {
  const plush = document.querySelector('.plush-wrap');
  const body = document.body;
  const playerHint = document.getElementById('playerHint');
  const letters = document.getElementById('letters');

  if (!plush || !playerHint || !letters) return;

  /** @type {YT.Player|null} */
  let player = null;
  let currentIndex = 0;
  let currentTrack = null;
  let timeupdateInterval = null;
  let letterMeasurements = [];

  function setHint(text, href) {
    playerHint.textContent = text;
    if (href) {
      playerHint.href = href;
      playerHint.classList.add('has-title');
      playerHint.style.cursor = 'pointer';
    } else {
      playerHint.href = '#';
      playerHint.classList.remove('has-title');
      playerHint.style.cursor = 'default';
    }
  }

  async function fetchTitle(videoId) {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!res.ok) throw new Error('noembed failed');
      const data = await res.json();
      if (data.title) return data.title;
    } catch (e) {
      console.warn('Could not fetch title via noembed:', e);
    }
    if (player && player.getVideoData) {
      try {
        const data = player.getVideoData();
        if (data?.title) return data.title;
      } catch {
        // ignore
      }
    }
    return 'YouTube track';
  }

  function updateHintForTrack(id) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    fetchTitle(id).then((title) => setHint(title, url));
  }

  function updateLetterMeasurements() {
    const containerRect = letters.getBoundingClientRect();
    letterMeasurements = letterEls.map((letter) => {
      const rect = letter.getBoundingClientRect();
      return {
        left: rect.left - containerRect.left,
        width: rect.width,
        right: rect.left - containerRect.left + rect.width,
        mono: letter.querySelector('.mono'),
      };
    });
  }

  function applyLetterClipPaths(revealPct) {
    if (!letterMeasurements.length) updateLetterMeasurements();

    const containerRect = letters.getBoundingClientRect();
    const revealPx = (revealPct / 100) * containerRect.width;

    letterMeasurements.forEach(({ left, right, width, mono }) => {
      if (revealPx <= left) {
        mono.style.clipPath = 'inset(0 0 0 0)';
      } else if (revealPx >= right) {
        mono.style.clipPath = 'inset(0 0 0 100%)';
      } else {
        const visible = ((right - revealPx) / width) * 100;
        mono.style.clipPath = `inset(0 0 0 ${100 - visible}%)`;
      }
    });
  }

  function updateProgress() {
    if (!player || !currentTrack || typeof player.getDuration !== 'function') return;
    const duration = player.getDuration();
    const currentTime = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
    if (!duration) return;
    const reveal = (currentTime / duration) * 100;
    letters.style.setProperty('--reveal', `${reveal}%`);
    applyLetterClipPaths(reveal);
  }

  function clearPlayer() {
    if (timeupdateInterval) {
      clearInterval(timeupdateInterval);
      timeupdateInterval = null;
    }
    if (player) {
      try {
        player.destroy();
      } catch {
        // ignore
      }
      player = null;
    }
    document.getElementById('bgVideoHost').innerHTML = '<div id="bgVideoPlayer"></div>';
    document.getElementById('audioHost').innerHTML = '<div id="audioPlayerPlayer"></div>';
  }

  async function loadTrack(index) {
    clearPlayer();
    markTrackPlayed(playlist[index].id);
    currentTrack = playlist[index];
    const isBackground = currentTrack.background;
    const hostEl = document.getElementById(isBackground ? 'bgVideoPlayer' : 'audioPlayerPlayer');

    body.classList.toggle('video-active', isBackground);

    const YT = await loadYouTubeAPI();

    await new Promise((resolve) => {
      player = new YT.Player(hostEl, {
        width: isBackground ? window.innerWidth : 1,
        height: isBackground ? window.innerHeight : 1,
        videoId: currentTrack.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          wmode: 'opaque',
          origin: window.location.origin,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            const p = event.target;
            player = p;
            p.setVolume(30);
            if (p.setPlaybackQuality) {
              p.setPlaybackQuality(isBackground ? 'hd1080' : 'hd720');
            }
            body.classList.add('loaded-audio');
            updateHintForTrack(currentTrack.id);
            resolve();
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              isPlaying = true;
              body.classList.add('playing');
              plush.classList.add('playing');
              startPlayerAnimations();
              if (!timeupdateInterval) timeupdateInterval = setInterval(updateProgress, 100);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              isPlaying = false;
              body.classList.remove('playing');
              plush.classList.remove('playing');
              if (timeupdateInterval) {
                clearInterval(timeupdateInterval);
                timeupdateInterval = null;
              }
              stopPlayerAnimations(letterEls);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              currentIndex = pickNextPseudoRandomTrack();
              loadTrack(currentIndex);
            }
          },
          onError: (event) => {
            console.error('YT player error:', event.data);
            currentIndex = (currentIndex + 1) % playlist.length;
            loadTrack(currentIndex);
          },
        },
      });
    });
  }

  function pickNextPseudoRandomTrack() {
    const played = getPlayedIds();
    let available = playlist.filter((t) => !played.includes(t.id));
    if (available.length === 0) {
      setPlayedIds([]);
      available = playlist.slice();
    }
    const next = available[Math.floor(Math.random() * available.length)];
    return playlist.findIndex((t) => t.id === next.id);
  }

  function markTrackPlayed(id) {
    const played = getPlayedIds();
    if (!played.includes(id)) {
      played.push(id);
      setPlayedIds(played);
    }
  }

  async function togglePlayback() {
    await loadPlaylist();
    if (!player) {
      currentIndex = pickNextPseudoRandomTrack();
      loadTrack(currentIndex).then(() => {
        if (player?.playVideo) player.playVideo();
      });
      return;
    }
    const state = player.getPlayerState ? player.getPlayerState() : -1;
    if (state === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  plush.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    plush.blur();
    togglePlayback();
  });

  plush.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePlayback();
    }
  });

  plush.addEventListener(
    'touchstart',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePlayback();
    },
    { passive: false },
  );

  window.addEventListener(
    'resize',
    debounce(() => {
      updateLetterMeasurements();
      if (isPlaying) updateProgress();
    }, 150),
  );
}

/**
 * Loads the remote playlist once, falling back to defaults on failure.
 */
export async function loadPlaylist() {
  if (playlistReady) return;
  if (playlistPromise) return playlistPromise;

  playlistPromise = (async () => {
    try {
      const response = await fetch(PLAYLIST_URL);
      if (!response.ok) throw new Error('network');
      const data = await response.json();
      if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
        playlist = data.tracks.map((t) => ({
          id: String(t.id),
          background: Boolean(t.background),
        }));
      }
    } catch (e) {
      console.warn('Failed to load playlist from gist, using default:', e);
    }
    playlist = shuffleArray(playlist);
    playlistReady = true;
  })();

  return playlistPromise;
}

/**
 * Simple debounce helper.
 * @template {(...args: any[]) => void} T
 * @param {T} fn
 * @param {number} delay
 * @returns {T}
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
