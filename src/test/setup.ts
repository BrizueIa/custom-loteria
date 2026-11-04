import '@testing-library/jest-dom/vitest';

// Polyfills / mocks for jsdom environment if needed
if (typeof window !== 'undefined') {
  // Mock HTMLMediaElement.play and pause
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};

  // Mock AudioContext
  class MockAudioContext {
    state = 'running';
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    resume = () => Promise.resolve();
    createOscillator = () => ({
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {},
    });
    createGain = () => ({
      gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
    });
    createBiquadFilter = () => ({
      type: 'bandpass',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: () => {},
    });
    createBuffer = () => ({
      getChannelData: () => new Float32Array(1024),
    });
    createBufferSource = () => ({
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
    });
  }

  (window as any).AudioContext = MockAudioContext;
  (window as any).webkitAudioContext = MockAudioContext;
}
