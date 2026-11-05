import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardStyleSelector } from '../CardStyleSelector';
import { LoteriaCard, CardStyleConfig } from '../../types/loteria';
import { LanguageProvider } from '../../i18n/LanguageContext';

describe('CardStyleSelector', () => {
  const mockCards: LoteriaCard[] = [
    {
      id: 'card-0',
      number: 0,
      isCover: true,
      name: 'Vivero Señora de las Plantas',
      image: 'data:image/svg+xml;utf8,<svg></svg>',
    },
    {
      id: 'card-1',
      number: 1,
      name: 'Aglaonema',
      image: 'data:image/svg+xml;utf8,<svg></svg>',
    },
    {
      id: 'card-2',
      number: 2,
      name: 'Albahacar',
      image: 'data:image/svg+xml;utf8,<svg></svg>',
    },
  ];

  const mockConfig: CardStyleConfig = {
    cardBgColor: '#FFFFFF',
    borderColor: '#141413',
    textColor: '#141413',
    frameStyle: 'classic_loteria',
    numberPosition: 'top-left',
    namePosition: 'bottom',
    showTaglineOnCard: false,
    fontFamily: 'serif',
  };

  it('defaults to Card #1 instead of Cover Card #0 so the number is clearly visible', () => {
    render(
      <LanguageProvider>
        <CardStyleSelector
          config={mockConfig}
          onChange={vi.fn()}
          cards={mockCards}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      </LanguageProvider>
    );

    // Number '1' must be visible in the card preview
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Aglaonema')).toBeInTheDocument();
  });

  it('allows user to switch sample card via dropdown selector to preview other cards', () => {
    render(
      <LanguageProvider>
        <CardStyleSelector
          config={mockConfig}
          onChange={vi.fn()}
          cards={mockCards}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      </LanguageProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'card-2' } });

    // Now Albahacar and number 2 must be displayed
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Albahacar')).toBeInTheDocument();
  });
});
