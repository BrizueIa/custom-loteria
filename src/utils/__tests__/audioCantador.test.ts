import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioCantador, getVoicesCatalog, SPANISH_VOICES, ENGLISH_VOICES } from '../audioCantador';

describe('audioCantador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVoicesCatalog', () => {
    it('returns Spanish catalog when lang is es', () => {
      const catalog = getVoicesCatalog('es');
      expect(catalog).toEqual(SPANISH_VOICES);
      expect(catalog).toHaveLength(4);
      expect(catalog.map(v => v.id)).toContain('dona_plantas');
      expect(catalog.map(v => v.id)).toContain('don_fermin');
    });

    it('returns English catalog when lang is en', () => {
      const catalog = getVoicesCatalog('en');
      expect(catalog).toEqual(ENGLISH_VOICES);
      expect(catalog).toHaveLength(4);
      expect(catalog.map(v => v.id)).toContain('jenny_us');
      expect(catalog.map(v => v.id)).toContain('guy_us');
    });
  });

  describe('sound effects & audio synthesizer', () => {
    it('can play and stop sounds without throwing errors', () => {
      expect(() => {
        audioCantador.playCardChime();
        audioCantador.playProceduralShuffle();
        audioCantador.playProceduralApplause();
        audioCantador.playShuffleSound(0.5);
        audioCantador.playApplause(0.5);
        audioCantador.playFanfare();
        audioCantador.stopShuffle();
        audioCantador.stopApplause();
        audioCantador.stop();
      }).not.toThrow();
    });

    it('preloads card without error', () => {
      expect(() => {
        audioCantador.preloadCard('El Gallo', 'dona_plantas');
      }).not.toThrow();
    });
  });

  describe('Web Speech fallback', () => {
    it('speaks via Web Speech if available and resolves true', async () => {
      // Mock window.speechSynthesis
      const speakMock = vi.fn((utterance) => {
        setTimeout(() => {
          if (utterance.onend) utterance.onend();
        }, 10);
      });

      (window as any).speechSynthesis = {
        speak: speakMock,
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        paused: false,
        getVoices: vi.fn(() => [
          { name: 'Google US English', lang: 'en-US', voiceURI: 'google-en' },
          { name: 'Google Español', lang: 'es-MX', voiceURI: 'google-es' }
        ])
      };

      (window as any).SpeechSynthesisUtterance = class {
        text: string;
        rate: number = 1;
        lang: string = '';
        voice: any = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      };

      const result = await audioCantador.speakWebSpeech('El 1. El Gallo', undefined, 1.0, undefined, 'dona_plantas');
      expect(result).toBe(true);
      expect(speakMock).toHaveBeenCalled();
    });
  });
});
