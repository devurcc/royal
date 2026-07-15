/**
 * Loads the YouTube IFrame Player API as a Promise.
 * Falls back to the global callback when the script resolves.
 */
export function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);

    const timeout = setTimeout(() => reject(new Error('YouTube IFrame API load timeout')), 15000);

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve(window.YT);
    };

    tag.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load YouTube IFrame API script'));
    };
  });
}
