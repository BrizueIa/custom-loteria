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
  private applauseAudio: HTMLAudioElement | null = null;
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

  // Play an audio URL with Promise resolution
  playAudioUrl(url: string, rate: number = 1.0): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }

        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.playbackRate = rate;

        audio.onended = () => resolve(true);
        audio.onerror = () => {
          resolve(false);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            resolve(false);
          });
        }
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Speak using device Web Speech API (fallback for custom cards)
  speakWebSpeech(text: string, voiceURI?: string, rate: number = 1.0): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve(false);
      }

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;

          const voices = window.speechSynthesis.getVoices();
          if (voiceURI) {
            const chosen = voices.find(v => v.voiceURI === voiceURI);
            if (chosen) utterance.voice = chosen;
          }
          utterance.lang = 'es-MX';

          utterance.onend = () => resolve(true);
          utterance.onerror = () => resolve(false);

          window.speechSynthesis.speak(utterance);
        }, 20);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Announce a card dynamically so ANY custom deck (not just plants) is pronounced with its real name
  async announceCard(textToSpeak: string, voiceId: VoiceId = 'dona_plantas', rate: number = 1.0, systemVoiceURI?: string) {
    // 1. Try same-origin TTS proxy with the specific voiceId
    const proxyUrl = `/api/tts?q=${encodeURIComponent(textToSpeak)}&voice=${encodeURIComponent(voiceId)}`;
    const proxyPlayed = await this.playAudioUrl(proxyUrl, rate);
    if (proxyPlayed) return;

    // 2. Fallback to Web Speech API (device voice synthesis in Spanish for any card name)
    const webSpeechOk = await this.speakWebSpeech(textToSpeak, systemVoiceURI, rate);
    if (webSpeechOk) return;
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
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.stopApplause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
