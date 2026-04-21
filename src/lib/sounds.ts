/**
 * Sound selection for SnapStudy
 * Short, high-quality SFX for better user feedback
 */

const SOUND_URLS = {
  flip: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  correct: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  wrong: "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3",
  success: "https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3",
};

export const playSound = (type: keyof typeof SOUND_URLS) => {
  try {
    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = 0.4; // Subtle volume
    audio.play().catch(e => console.warn("Audio playback disabled by browser policy", e));
  } catch (err) {
    console.error("Failed to play sound:", err);
  }
};
