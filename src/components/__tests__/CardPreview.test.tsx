import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardPreview } from '../CardPreview';
import { LoteriaCard, CardStyleConfig } from '../../types/loteria';

describe('CardPreview', () => {
  const mockCard: LoteriaCard = {
    id: '1',
    number: 1,
    name: 'El Gallo',
    image: 'data:image/svg+xml;utf8,<svg></svg>'
  };

  const baseStyle: CardStyleConfig = {
    cardBgColor: '#FFFFFF',
    borderColor: '#000000',
    textColor: '#1C1917',
    frameStyle: 'classic_loteria',
    numberPosition: 'top-left',
    namePosition: 'bottom',
    showTaglineOnCard: false,
    fontFamily: 'serif'
  };

  it('renders card name and number correctly', () => {
    render(<CardPreview card={mockCard} style={baseStyle} />);
    expect(screen.getByText('El Gallo')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('keeps name container symmetrically centered when number is at the bottom', () => {
    const { container: containerTop } = render(
      <CardPreview card={mockCard} style={{ ...baseStyle, numberPosition: 'top-left' }} />
    );
    const nameContainerTop = containerTop.querySelector('h4')?.parentElement;

    const { container: containerBottomLeft } = render(
      <CardPreview card={mockCard} style={{ ...baseStyle, numberPosition: 'bottom-left' }} />
    );
    const nameContainerBottomLeft = containerBottomLeft.querySelector('h4')?.parentElement;

    const { container: containerBottomRight } = render(
      <CardPreview card={mockCard} style={{ ...baseStyle, numberPosition: 'bottom-right' }} />
    );
    const nameContainerBottomRight = containerBottomRight.querySelector('h4')?.parentElement;

    // The name container should have the exact same symmetric classes in all positions
    expect(nameContainerBottomLeft?.className).toBe(nameContainerTop?.className);
    expect(nameContainerBottomRight?.className).toBe(nameContainerTop?.className);
    expect(nameContainerBottomLeft?.className).toContain('text-center');
    expect(nameContainerBottomLeft?.className).toContain('px-4');
    expect(nameContainerBottomLeft?.className).not.toContain('pr-9');
    expect(nameContainerBottomLeft?.className).not.toContain('pl-9');
  });

  it('keeps name container symmetrically centered when name is on top and number is on top', () => {
    const topNameStyle: CardStyleConfig = {
      ...baseStyle,
      namePosition: 'top',
      numberPosition: 'top-right'
    };
    const { container } = render(<CardPreview card={mockCard} style={topNameStyle} />);
    const nameContainer = container.querySelector('h4')?.parentElement;

    expect(nameContainer?.className).toContain('text-center');
    expect(nameContainer?.className).toContain('px-4');
    expect(nameContainer?.className).not.toContain('pr-9');
    expect(nameContainer?.className).not.toContain('pl-9');
  });
});
