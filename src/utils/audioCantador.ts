// Bulletproof Audio and Voice Narrator Engine for Loteria
// Optimized for Production (PWA & GitHub Pages) using direct Web Speech API
// Features 4 distinct character profiles with pitch/rate acoustic modeling:
// 1. "dona_plantas" - Voz Cálida y Tradicional (Femenina)
// 2. "don_fermin"   - Cantador de Feria (Masculina Grave y Enérgica)
// 3. "sobrina"      - Voz Juvenil (Alegre y Brillante)
// 4. "locutor"      - Locutor Radiofónico (Masculina Clara y Pausada)

export type VoiceId = 
  | 'dona_plantas' | 'don_fermin' | 'sobrina' | 'locutor'
  | 'jenny_us' | 'guy_us' | 'sonia_uk' | 'ryan_uk';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  gender: string;
  desc: string;
  badge: string;
  pitch: number;
  rateMultiplier: number;
  preferredKeywords: string[];
}

export const SPANISH_VOICES: VoiceProfile[] = [
  {
    id: 'dona_plantas',
    name: 'Dalia • Tradicional',
    gender: 'Femenina',
    desc: 'Tono cálido, amigable y tradicional de lotería familiar',
    badge: '🇲🇽 México • Cálida',
    pitch: 1.04,
    rateMultiplier: 0.96,
    preferredKeywords: ['dalia', 'paulina', 'sabina', 'monica', 'helena', 'paloma', 'laura', 'es-mx', 'es-us', 'es-419']
  },
  {
    id: 'don_fermin',
    name: 'Don Fermín • Gritón',
    gender: 'Masculina',
    desc: 'Voz grave, potente y festiva típica de las ferias populares',
    badge: '🇲🇽 México • Grave',
    pitch: 0.82,
    rateMultiplier: 1.05,
    preferredKeywords: ['jorge', 'juan', 'diego', 'raul', 'carlos', 'miguel', 'es-mx', 'es-es']
  },
  {
    id: 'sobrina',
    name: 'La Sobrina • Juvenil',
    gender: 'Femenina',
    desc: 'Voz vivaz, ágil y alegre para partidas dinámicas',
    badge: '🇲🇽 Juvenil • Alegre',
    pitch: 1.18,
    rateMultiplier: 1.06,
    preferredKeywords: ['elvira', 'helena', 'laura', 'lucia', 'es-es', 'es-419']
  },
  {
    id: 'locutor',
    name: 'El Locutor • Radiofónico',
    gender: 'Masculina',
    desc: 'Cadencia pausada, elocuente y muy clara para salones grandes',
    badge: '📻 Locutor • Claro',
    pitch: 0.90,
    rateMultiplier: 0.90,
    preferredKeywords: ['gonzalo', 'alvaro', 'carlos', 'pablo', 'es-co', 'es-mx']
  }
];

export const ENGLISH_VOICES: VoiceProfile[] = [
  {
    id: 'jenny_us',
    name: 'Jenny (US)',
    gender: 'Female',
    desc: 'Clear, lively and welcoming caller tone',
    badge: '🇺🇸 US • Female',
    pitch: 1.05,
    rateMultiplier: 1.0,
    preferredKeywords: ['jenny', 'samantha', 'zira', 'en-us']
  },
  {
    id: 'guy_us',
    name: 'Guy (US)',
    gender: 'Male',
    desc: 'Enthusiastic and energetic lottery caller',
    badge: '🇺🇸 US • Male',
    pitch: 0.88,
    rateMultiplier: 1.04,
    preferredKeywords: ['guy', 'david', 'mark', 'en-us']
  },
  {
    id: 'sonia_uk',
    name: 'Sonia (UK)',
    gender: 'Female',
    desc: 'Crisp and friendly British accent',
    badge: '🇬🇧 UK • Female',
    pitch: 1.05,
    rateMultiplier: 0.98,
    preferredKeywords: ['sonia', 'libby', 'en-gb']
  },
  {
    id: 'ryan_uk',
    name: 'Ryan (UK)',
    gender: 'Male',
    desc: 'Engaging, polite and clear caller',
    badge: '🇬🇧 UK • Male',
    pitch: 0.90,
    rateMultiplier: 0.96,
    preferredKeywords: ['ryan', 'oliver', 'george', 'en-gb']
  }
];

export const VOICES_CATALOG: VoiceProfile[] = SPANISH_VOICES;

export function getVoicesCatalog(lang: 'es' | 'en'): VoiceProfile[] {
  return lang === 'en' ? ENGLISH_VOICES : SPANISH_VOICES;
}

export function getAssetUrl(path: string): string {
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : './';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
}

class AudioCantador {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioResolve: ((val: boolean) => void) | null = null;
  private currentWebSpeechResolve: ((val: boolean) => void) | null = null;
  private currentCountdownTimer: number | null = null;
  private watchdogTimer: number | null = null;
  private applauseAudio: HTMLAudioElement | null = null;
  private shuffleAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Desbloquea síncronamente el motor de audio y Web Speech API en móviles (iOS Safari / Android Chrome).
   * Debe ejecutarse en el manejador directo de un clic del usuario (ej. "¡Buenas! Iniciar").
   */
  unlock(): void {
    if (typeof window === 'undefined') return;

    // Desbloquear AudioContext
    this.getAudioContext();

    // Desbloquear SpeechSynthesis
    if ('speechSynthesis' in window && !this.isUnlocked) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        // Emitir utterance silencioso para habilitar permisos en móvil
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
        this.isUnlocked = true;
      } catch (_) {}
    }
  }

  // Pre-calentamiento compatible con versiones anteriores
  preloadCard(_textToSpeak: string, _voiceId: VoiceId = 'dona_plantas'): void {
    // En Web Speech API nativa no se requiere descarga externa por proxy
  }

  // Reproduce un archivo de audio estático local con promesa de término
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

          // Entrar en cuenta regresiva en el último segundo de audio
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

  // Encuentra la mejor voz disponible en el dispositivo según el perfil y preferencia
  private findBestVoice(voiceId: VoiceId, voiceURI?: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Si el usuario seleccionó una voz específica por URI en la configuración
    if (voiceURI) {
      const explicit = voices.find((v) => v.voiceURI === voiceURI);
      if (explicit) return explicit;
    }

    const allProfiles = [...SPANISH_VOICES, ...ENGLISH_VOICES];
    const profile = allProfiles.find((p) => p.id === voiceId) || SPANISH_VOICES[0];
    const isEnglish = profile.id.endsWith('_us') || profile.id.endsWith('_uk');
    const targetLangPrefix = isEnglish ? 'en' : 'es';

    // Filtrar voces del idioma correspondiente
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLangPrefix));
    if (langVoices.length === 0) {
      return voices[0] || null;
    }

    // 2. Buscar por palabras clave del perfil (nombres de voz conocidos y variantes regionales)
    for (const kw of profile.preferredKeywords) {
      const match = langVoices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase().replace('_', '-');
        return name.includes(kw) || lang.includes(kw);
      });
      if (match) return match;
    }

    // 3. Priorizar acentos mexicanos / latinos si es español
    if (!isEnglish) {
      const mxVoice = langVoices.find((v) => v.lang.toLowerCase().includes('mx') || v.lang.toLowerCase().includes('419'));
      if (mxVoice) return mxVoice;
    }

    return langVoices[0];
  }

  /**
   * Narración directa mediante Web Speech API con modulación acústica de tono (pitch) y velocidad (rate)
   * e inmunidad a bloqueos con Watchdog Timer.
   */
  speakWebSpeech(
    text: string,
    voiceURI?: string,
    rate: number = 1.0,
    onCountdownReady?: () => void,
    voiceId: VoiceId = 'dona_plantas'
  ): Promise<boolean> {
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

        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }

        // Cancelar síntesis previa de forma segura
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
          if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
          }
          if (this.currentWebSpeechResolve === cleanupAndResolve) {
            this.currentWebSpeechResolve = null;
          }
          resolve(success);
        };

        this.currentWebSpeechResolve = cleanupAndResolve;

        // Pequeño timeout de 30ms para permitir que Chromium procese cancel() antes de speak()
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          const allProfiles = [...SPANISH_VOICES, ...ENGLISH_VOICES];
          const profile = allProfiles.find((p) => p.id === voiceId) || SPANISH_VOICES[0];

          // Modulación acústica según el personaje
          utterance.pitch = profile.pitch;
          const effectiveRate = Math.max(0.65, Math.min(1.5, rate * profile.rateMultiplier));
          utterance.rate = effectiveRate;

          // Asignar mejor voz del dispositivo
          const selectedVoice = this.findBestVoice(voiceId, voiceURI);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
          } else {
            const isEnglish = profile.id.endsWith('_us') || profile.id.endsWith('_uk');
            utterance.lang = isEnglish ? 'en-US' : 'es-MX';
          }

          // Programar cuenta regresiva en el último segundo (~14 caracteres por segundo)
          const estimatedDurationSec = Math.max(1.0, (text.length / 14) / effectiveRate);
          const triggerDelayMs = Math.max(200, (estimatedDurationSec - 0.9) * 1000);
          this.currentCountdownTimer = window.setTimeout(() => {
            fireCountdown();
          }, triggerDelayMs);

          // Watchdog Anti-Congelamiento: si el navegador móvil no emite onend, continuar
          const maxSafetyMs = Math.max(3000, estimatedDurationSec * 1000 + 2000);
          this.watchdogTimer = window.setTimeout(() => {
            console.warn('[audioCantador] Watchdog activado para:', text);
            cleanupAndResolve(true);
          }, maxSafetyMs);

          utterance.onend = () => cleanupAndResolve(true);
          utterance.onerror = (e) => {
            // Ignorar errores por interrupción manual
            if (e.error === 'interrupted' || e.error === 'canceled') {
              cleanupAndResolve(false);
            } else {
              console.warn('[audioCantador] Speech error:', e);
              cleanupAndResolve(false);
            }
          };

          window.speechSynthesis.speak(utterance);
        }, 30);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Anuncia la carta usando síntesis de voz nativa optimizada (0ms delay y offline)
  async announceCard(
    textToSpeak: string,
    voiceId: VoiceId = 'dona_plantas',
    rate: number = 1.0,
    systemVoiceURI?: string,
    onCountdownReady?: () => void
  ): Promise<boolean> {
    if (!textToSpeak.trim()) {
      if (onCountdownReady) onCountdownReady();
      return true;
    }
    return this.speakWebSpeech(textToSpeak, systemVoiceURI, rate, onCountdownReady, voiceId);
  }

  // Frases especiales ("¡Buenas!", "¡Lotería!"): utiliza primero archivos MP3 estáticos locales
  async speakSpecial(
    specialKey: 'loteria' | 'buenas' | 'desempate' | 'comenzar',
    voiceId: VoiceId = 'dona_plantas',
    rate: number = 1.0
  ): Promise<void> {
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

    // 1. Probar audio estático del personaje
    const primaryUrl = getAssetUrl(`audio/voices/${voiceId}/${specialKey}.mp3`);
    const okStatic = await this.playAudioUrl(primaryUrl, rate);
    if (okStatic) return;

    const specialUrl = getAssetUrl(`audio/voices/${voiceId}/special-${specialKey}.mp3`);
    const ok2 = await this.playAudioUrl(specialUrl, rate);
    if (ok2) return;

    // 2. Probar audio estático genérico (ej. public/audio/buenas.mp3, public/audio/loteria.mp3)
    const genericUrl = getAssetUrl(`audio/${specialKey}.mp3`);
    const okGeneric = await this.playAudioUrl(genericUrl, rate);
    if (okGeneric) return;

    // 3. Narración mediante Web Speech API
    await this.speakWebSpeech(phrase, undefined, rate, undefined, voiceId);
  }

  stop() {
    if (this.currentCountdownTimer) {
      clearTimeout(this.currentCountdownTimer);
      this.currentCountdownTimer = null;
    }
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
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

  // Reproduce sonido de barajeado de cartas
  playShuffleSound(volume: number = 0.85): void {
    try {
      this.stopShuffle();
      const audio = new Audio(getAssetUrl('audio/barajar.mp3'));
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

  // Efecto procedural de barajado con Web Audio API
  playProceduralShuffle(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

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

  // Reproduce aplausos y vítores
  playApplause(volume: number = 0.9): void {
    try {
      if (this.applauseAudio) {
        this.applauseAudio.pause();
        this.applauseAudio.currentTime = 0;
      }
      const audio = new Audio(getAssetUrl('audio/aplausos.mp3'));
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

  // Aplausos sintéticos en caso de que el archivo mp3 no cargue
  playProceduralApplause(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const duration = 3.5;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

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

  // Campana tradicional al cantar cada carta
  playCardChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playFanfare(): void {
    this.playApplause();
  }
}

export const audioCantador = new AudioCantador();
