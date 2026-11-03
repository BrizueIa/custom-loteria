// Bulletproof Audio and Voice Narrator Engine for Loteria
// Supports 4 distinct high-quality offline character voices:
// 1. "dona_plantas" - Voz Femenina Cálida y Tradicional
// 2. "don_fermin"   - Cantador de Feria (Voz Masculina Grave)
// 3. "sobrina"      - Voz Femenina Juvenil y Alegre
// 4. "locutor"      - Voz Masculina Radiofónica / Posada

export type VoiceId = 
  | 'dona_plantas' | 'don_fermin' | 'sobrina' | 'locutor'
  | 'jenny_us' | 'guy_us' | 'sonia_uk' | 'ryan_uk';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  gender: string;
  desc: string;
  badge: string;
}

export const SPANISH_VOICES: VoiceProfile[] = [
  {
    id: 'dona_plantas',
    name: 'Dalia (México)',
    gender: 'Femenina',
    desc: 'Mujer mexicana, entonación cálida y tradicional',
    badge: '🇲🇽 México • Mujer'
  },
  {
    id: 'don_fermin',
    name: 'Jorge (México)',
    gender: 'Masculina',
    desc: 'Hombre mexicano, cantador tradicional',
    badge: '🇲🇽 México • Hombre'
  },
  {
    id: 'sobrina',
    name: 'Elvira (España)',
    gender: 'Femenina',
    desc: 'Mujer de España, acento castellano bien marcado',
    badge: '🇪🇸 España • Mujer'
  },
  {
    id: 'locutor',
    name: 'Gonzalo (Colombia)',
    gender: 'Masculina',
    desc: 'Hombre colombiano, timbre y cadencia clara',
    badge: '🇨🇴 Colombia • Hombre'
  }
];

export const ENGLISH_VOICES: VoiceProfile[] = [
  {
    id: 'jenny_us',
    name: 'Jenny (US)',
    gender: 'Female',
    desc: 'American female, clear, lively and welcoming tone',
    badge: '🇺🇸 US • Female'
  },
  {
    id: 'guy_us',
    name: 'Guy (US)',
    gender: 'Male',
    desc: 'American male, enthusiastic bingo/lottery caller',
    badge: '🇺🇸 US • Male'
  },
  {
    id: 'sonia_uk',
    name: 'Sonia (UK)',
    gender: 'Female',
    desc: 'British female, crisp and friendly accent',
    badge: '🇬🇧 UK • Female'
  },
  {
    id: 'ryan_uk',
    name: 'Ryan (UK)',
    gender: 'Male',
    desc: 'British male, engaging and polite lottery caller',
    badge: '🇬🇧 UK • Male'
  }
];

export const VOICES_CATALOG: VoiceProfile[] = SPANISH_VOICES;

export function getVoicesCatalog(lang: 'es' | 'en'): VoiceProfile[] {
  return lang === 'en' ? ENGLISH_VOICES : SPANISH_VOICES;
}

class AudioCantador {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioResolve: ((val: boolean) => void) | null = null;
  private currentWebSpeechResolve: ((val: boolean) => void) | null = null;
  private currentCountdownTimer: number | null = null;
  private preloadCache: Map<string, HTMLAudioElement> = new Map();
  private applauseAudio: HTMLAudioElement | null = null;
  private shuffleAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Pre-fetch TTS audio in background so when card is called, playback starts with 0ms delay
  preloadCard(textToSpeak: string, voiceId: VoiceId = 'dona_plantas'): void {
    if (typeof window === 'undefined' || !textToSpeak.trim()) return;
    const proxyUrl = `/api/tts?q=${encodeURIComponent(textToSpeak)}&voice=${encodeURIComponent(voiceId)}`;
    if (this.preloadCache.has(proxyUrl)) return;

    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = proxyUrl;
      this.preloadCache.set(proxyUrl, audio);
      // Keep cache bounded
      if (this.preloadCache.size > 30) {
        const firstKey = this.preloadCache.keys().next().value;
        if (firstKey) this.preloadCache.delete(firstKey);
      }
    } catch (e) {
      try {
        fetch(proxyUrl).catch(() => {});
      } catch (e2) {}
    }
  }

  // Play an audio URL with Promise resolution when finished.
  // onCountdownReady fires when the audio enters its final 1.0s to start timer early.
  playAudioUrl(url: string, rate: number = 1.0, onCountdownReady?: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.currentAudioResolve) {
          this.currentAudioResolve(false);
          this.currentAudioResolve = null;
        }

        if (this.currentCountdownTimer) {
          clearTimeout(this.currentCountdownTimer);
          this.currentCountdownTimer = null;
        }

        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
          this.currentAudio = null;
        }

        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.playbackRate = rate;

        let hasFiredCountdown = false;
        const fireCountdown = () => {
          if (hasFiredCountdown) return;
          hasFiredCountdown = true;
          if (this.currentCountdownTimer) {
            clearTimeout(this.currentCountdownTimer);
            this.currentCountdownTimer = null;
          }
          if (onCountdownReady) {
            onCountdownReady();
          }
        };

        const setupCountdownSchedule = () => {
          const duration = audio.duration;
          if (!duration || isNaN(duration) || duration <= 0) return;

          // Entrar en cuenta regresiva en el último segundo de audio (compensando silencios de cola)
          const leadSeconds = 1.0;
          const triggerAtTime = Math.max(0.3, duration - leadSeconds);
          const timeUntilTriggerSec = (triggerAtTime - audio.currentTime) / (audio.playbackRate || 1.0);

          if (timeUntilTriggerSec <= 0.05) {
            fireCountdown();
          } else {
            if (this.currentCountdownTimer) clearTimeout(this.currentCountdownTimer);
            this.currentCountdownTimer = window.setTimeout(() => {
              fireCountdown();
            }, Math.max(0, timeUntilTriggerSec * 1000));
          }
        };

        audio.onloadedmetadata = () => {
          setupCountdownSchedule();
        };

        audio.ontimeupdate = () => {
          const duration = audio.duration;
          if (duration && !isNaN(duration) && duration > 0) {
            const triggerAtTime = Math.max(0.3, duration - 1.0);
            if (audio.currentTime >= triggerAtTime) {
              fireCountdown();
            }
          }
        };

        let hasResolved = false;
        const cleanupAndResolve = (success: boolean) => {
          if (hasResolved) return;
          hasResolved = true;
          fireCountdown();
          if (this.currentCountdownTimer) {
            clearTimeout(this.currentCountdownTimer);
            this.currentCountdownTimer = null;
          }
          if (this.currentAudioResolve === cleanupAndResolve) {
            this.currentAudioResolve = null;
          }
          resolve(success);
        };

        this.currentAudioResolve = cleanupAndResolve;

        audio.onended = () => cleanupAndResolve(true);
        audio.onerror = () => cleanupAndResolve(false);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setupCountdownSchedule();
          }).catch(() => {
            cleanupAndResolve(false);
          });
        }
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Speak using device Web Speech API (fallback for custom cards)
  speakWebSpeech(text: string, voiceURI?: string, rate: number = 1.0, onCountdownReady?: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onCountdownReady) onCountdownReady();
        return resolve(false);
      }

      try {
        if (this.currentWebSpeechResolve) {
          this.currentWebSpeechResolve(false);
          this.currentWebSpeechResolve = null;
        }

        if (this.currentCountdownTimer) {
          clearTimeout(this.currentCountdownTimer);
          this.currentCountdownTimer = null;
        }

        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        let hasFiredCountdown = false;
        const fireCountdown = () => {
          if (hasFiredCountdown) return;
          hasFiredCountdown = true;
          if (this.currentCountdownTimer) {
            clearTimeout(this.currentCountdownTimer);
            this.currentCountdownTimer = null;
          }
          if (onCountdownReady) {
            onCountdownReady();
          }
        };

        let hasResolved = false;
        const cleanupAndResolve = (success: boolean) => {
          if (hasResolved) return;
          hasResolved = true;
          fireCountdown();
          if (this.currentCountdownTimer) {
            clearTimeout(this.currentCountdownTimer);
            this.currentCountdownTimer = null;
          }
          if (this.currentWebSpeechResolve === cleanupAndResolve) {
            this.currentWebSpeechResolve = null;
          }
          resolve(success);
        };

        this.currentWebSpeechResolve = cleanupAndResolve;

        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;

          const voices = window.speechSynthesis.getVoices();
          if (voiceURI) {
            const chosen = voices.find(v => v.voiceURI === voiceURI);
            if (chosen) utterance.voice = chosen;
          }
          utterance.lang = 'es-MX';

          // Estimar duración para disparar en el último segundo (~15 caracteres por segundo)
          const estimatedDurationSec = Math.max(1.0, (text.length / 15) / (rate || 1.0));
          const triggerDelayMs = Math.max(300, (estimatedDurationSec - 1.0) * 1000);
          this.currentCountdownTimer = window.setTimeout(() => {
            fireCountdown();
          }, triggerDelayMs);

          utterance.onend = () => cleanupAndResolve(true);
          utterance.onerror = () => cleanupAndResolve(false);

          window.speechSynthesis.speak(utterance);
        }, 20);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Announce a card dynamically so ANY custom deck is pronounced with its real name.
  // Resolves as a Promise when the spoken audio has finished playing.
  // onCountdownReady fires when the audio enters its final 1.0s.
  async announceCard(
    textToSpeak: string,
    voiceId: VoiceId = 'dona_plantas',
    rate: number = 1.0,
    systemVoiceURI?: string,
    onCountdownReady?: () => void
  ): Promise<boolean> {
    // 1. Try same-origin TTS proxy with the specific voiceId
    const proxyUrl = `/api/tts?q=${encodeURIComponent(textToSpeak)}&voice=${encodeURIComponent(voiceId)}`;
    const proxyPlayed = await this.playAudioUrl(proxyUrl, rate, onCountdownReady);
    if (proxyPlayed) return true;

    // 2. Fallback to Web Speech API (device voice synthesis in Spanish for any card name)
    const webSpeechOk = await this.speakWebSpeech(textToSpeak, systemVoiceURI, rate, onCountdownReady);
    if (webSpeechOk) return true;

    return false;
  }

  // Speak special victory/game phrases (primarily "¡Buenas!" or "Bingo!")
  async speakSpecial(specialKey: 'loteria' | 'buenas' | 'desempate' | 'comenzar', voiceId: VoiceId = 'dona_plantas', rate: number = 1.0) {
    const isEnglishVoice = voiceId.endsWith('_us') || voiceId.endsWith('_uk');
    const phrases: Record<string, { es: string; en: string }> = {
      'buenas': { es: '¡Buenas!', en: 'Bingo! We have a winner!' },
      'loteria': { es: '¡Lotería!', en: 'Lottery!' },
      'desempate': { es: '¡Carta de desempate!', en: 'Tie-breaker card!' },
      'comenzar': { es: '¡Corre y se va corriendo!', en: 'Here we go!' }
    };
    const phrase = phrases[specialKey]
      ? (isEnglishVoice ? phrases[specialKey].en : phrases[specialKey].es)
      : (specialKey === 'buenas' ? '¡Buenas!' : '¡Lotería!');

    // First try dynamic TTS endpoint so voice matches chosen persona
    const proxyUrl = `/api/tts?q=${encodeURIComponent(phrase)}&voice=${encodeURIComponent(voiceId)}`;
    const ok = await this.playAudioUrl(proxyUrl, rate);
    if (ok) return;

    // Fallbacks
    const primaryUrl = `/audio/voices/${voiceId}/${specialKey}.mp3`;
    const okStatic = await this.playAudioUrl(primaryUrl, rate);
    if (okStatic) return;

    const specialUrl = `/audio/voices/${voiceId}/special-${specialKey}.mp3`;
    const ok2 = await this.playAudioUrl(specialUrl, rate);
    if (ok2) return;

    if (specialKey === 'buenas') {
      await this.playAudioUrl('/audio/buenas.mp3', rate);
    }
  }

  stop() {
    if (this.currentCountdownTimer) {
      clearTimeout(this.currentCountdownTimer);
      this.currentCountdownTimer = null;
    }
    if (this.currentAudioResolve) {
      this.currentAudioResolve(false);
      this.currentAudioResolve = null;
    }
    if (this.currentWebSpeechResolve) {
      this.currentWebSpeechResolve(false);
      this.currentWebSpeechResolve = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.stopApplause();
    this.stopShuffle();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Play realistic card shuffle sound
  playShuffleSound(volume: number = 0.85): void {
    try {
      this.stopShuffle();
      const audio = new Audio('/audio/barajar.mp3');
      audio.volume = Math.max(0, Math.min(1, volume));
      this.shuffleAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.playProceduralShuffle();
        });
      }
    } catch (e) {
      this.playProceduralShuffle();
    }
  }

  stopShuffle(): void {
    if (this.shuffleAudio) {
      try {
        this.shuffleAudio.pause();
        this.shuffleAudio.currentTime = 0;
      } catch (e) {}
      this.shuffleAudio = null;
    }
  }

  // Procedural Web Audio card riffle shuffle fallback
  playProceduralShuffle(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const numSnaps = 26;
      for (let i = 0; i < numSnaps; i++) {
        const snapTime = now + 0.04 + (i / numSnaps) * 0.45 + (Math.random() - 0.5) * 0.02;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000 + Math.random() * 800, snapTime);
        osc.frequency.exponentialRampToValueAtTime(300, snapTime + 0.025);

        filter.type = 'bandpass';
        filter.frequency.value = 2400;

        gain.gain.setValueAtTime(0.09 + Math.random() * 0.05, snapTime);
        gain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.025);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(snapTime);
        osc.stop(snapTime + 0.025);
      }
    } catch (e) {}
  }

  // Play celebratory crowd applause & cheer
  playApplause(volume: number = 0.9): void {
    try {
      if (this.applauseAudio) {
        this.applauseAudio.pause();
        this.applauseAudio.currentTime = 0;
      }
      const audio = new Audio('/audio/aplausos.mp3');
      audio.volume = Math.max(0, Math.min(1, volume));
      this.applauseAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.playProceduralApplause();
        });
      }
    } catch (e) {
      this.playProceduralApplause();
    }
  }

  stopApplause(): void {
    if (this.applauseAudio) {
      try {
        this.applauseAudio.pause();
        this.applauseAudio.currentTime = 0;
      } catch (e) {}
      this.applauseAudio = null;
    }
  }

  // Procedural Web Audio applause fallback
  playProceduralApplause(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const duration = 3.5;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate bursty noise simulating many individuals clapping
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);
    } catch (e) {}
  }

  // Card bell chime
  playCardChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // Fanfare / celebration alias
  playFanfare() {
    this.playApplause();
  }
}

export const audioCantador = new AudioCantador();
