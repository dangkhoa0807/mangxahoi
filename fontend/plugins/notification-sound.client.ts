export default defineNuxtPlugin(() => {
  class NotificationSound {
    private audioCache: { [key: string]: HTMLAudioElement } = {};

    /**
     * Preload an audio file to avoid delay
     * @param {string} key - Identifier for the sound
     * @param {string} url - URL of the audio file
     */
    preloadSound(key: string, url: string) {
      if (!this.audioCache[key]) {
        const audio = new Audio(url);
        audio.load();
        this.audioCache[key] = audio;
      }
    }

    /**
     * Play the specified sound
     * @param {string} key - Identifier for the sound
     */
    playSound(key: string) {
      const audio = this.audioCache[key];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((error) => {
          console.error("Failed to play sound:", error);
        });
      } else {
        console.warn(`Sound with key "${key}" is not preloaded.`);
      }
    }
  }

  const notificationSound = new NotificationSound();

  return {
    provide: {
      notificationSound,
    },
  };
});
