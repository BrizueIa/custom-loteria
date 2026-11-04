import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioCantador, getVoicesCatalog, SPANISH_VOICES, ENGLISH_VOICES } from '../audioCantador';

describe('audioCantador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVoicesCatalog', () => {
    it('returns Spanish catalog with pitch and rate profiles', () => {
      const catalog = getVoicesCatalog('es');
      expect(catalog).toEqual(SPANISH_VOICES);
      expect(catalog).toHaveLength(4);
      
      const dona = catalog.find(v => v.id === 'dona_plantas')!;
      const fermin = catalog.find(v => v.id === 'don_fermin')!;
      
      expect(dona.pitch).toBeGreaterThan(1.0);
      expect(fermin.pitch).toBeLessThan(0.9); // Fermin has deep gravelly tone
      expect(fermin.rateMultiplier).toBeGreaterThan(1.0);
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
    it('can unlock audio engine without throwing', () => {
      expect(() => {
        audioCantador.unlock();
      }).not.toThrow();
    });

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

  describe('Web Speech synthesis and voice selection', () => {
    it('announces card via Web Speech with correct pitch and language', async () => {
      let capturedUtterance: any = null;
      const speakMock = vi.fn((utterance) => {
        capturedUtterance = utterance;
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
        pitch: number = 1;
        lang: string = '';
        voice: any = null;
        volume: number = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      };

      const result = await audioCantador.announceCard('1. El Gallo', 'don_fermin', 1.0);
      expect(result).toBe(true);
      expect(speakMock).toHaveBeenCalled();
      expect(capturedUtterance).not.toBeNull();
      expect(capturedUtterance.pitch).toBeCloseTo(0.82, 1); // Don Fermin pitch
    });
  });
});
