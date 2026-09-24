/**
 * Web Audio API based Alert Sound Synthesizer
 * Plays high-fidelity chime notifications without needing external audio assets.
 */

export const playNewOrderAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Sequence of pleasant luxury chime tones: E5 -> G#5 -> B5 -> E6
    const notes = [
      { freq: 659.25, start: 0.0, duration: 0.22, gain: 0.25 },
      { freq: 830.61, start: 0.12, duration: 0.25, gain: 0.30 },
      { freq: 987.77, start: 0.24, duration: 0.30, gain: 0.35 },
      { freq: 1318.51, start: 0.38, duration: 0.55, gain: 0.40 },
    ];

    notes.forEach(({ freq, start, duration, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    });
  } catch (err) {
    console.warn('Unable to play audio alert:', err);
  }
};
