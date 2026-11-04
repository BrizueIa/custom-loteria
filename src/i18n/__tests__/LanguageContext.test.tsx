import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { LanguageProvider, useLanguage } from '../LanguageContext';
import { translations } from '../translations';

describe('LanguageContext & Translations', () => {
  it('has identical keys in both Spanish and English translation dictionaries', () => {
    const esKeys = Object.keys(translations.es).sort();
    const enKeys = Object.keys(translations.en).sort();

    const missingInEn = esKeys.filter(k => !enKeys.includes(k));
    const missingInEs = enKeys.filter(k => !esKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInEs).toEqual([]);
    expect(esKeys.length).toBe(enKeys.length);
  });

  it('interpolates parameters correctly in translations', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    // Test parameter replacement
    const interpolated = result.current.t('deck_ready_desc', { count: 54 });
    expect(interpolated).toContain('54 cartas');

    // Switch to English and test
    act(() => {
      result.current.setLanguage('en');
    });

    const interpolatedEn = result.current.t('deck_ready_desc', { count: 54 });
    expect(interpolatedEn).toContain('54 cards');
  });

  it('toggles language back and forth', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('es');
    });
    expect(result.current.language).toBe('es');

    act(() => {
      result.current.toggleLanguage();
    });
    expect(result.current.language).toBe('en');

    act(() => {
      result.current.toggleLanguage();
    });
    expect(result.current.language).toBe('es');
  });
});
