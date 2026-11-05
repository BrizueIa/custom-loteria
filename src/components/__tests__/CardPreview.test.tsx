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

  it('applies per-card absorbed backgroundColor inside the black inner frame while keeping outer white margin', () => {
    const cardWithBg: LoteriaCard = {
      ...mockCard,
      name: 'El Helecho',
      number: 2,
      backgroundColor: '#71D4FF',
    };
    const { container } = render(<CardPreview card={cardWithBg} style={baseStyle} />);
    const outerCard = container.firstElementChild as HTMLElement;
    const innerFrame = outerCard.firstElementChild as HTMLElement;

    expect(outerCard.className).toContain('bg-white');
    expect(innerFrame.style.backgroundColor).toBe('rgb(113, 212, 255)');
    expect(innerFrame.className).toContain('border-stone-950');
  });

  it('hides card number when card is the Cover / Portada card (number 0)', () => {
    const coverCard: LoteriaCard = {
      id: 'card-0',
      number: 0,
      isCover: true,
      name: 'Vivero Señora de las Plantas',
      image: 'data:image/svg+xml;utf8,<svg></svg>',
    };
    render(<CardPreview card={coverCard} style={baseStyle} />);
    expect(screen.getByText('Vivero Señora de las Plantas')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders logo image with corner position class and opacity when logo is enabled', () => {
    const styleWithLogo: CardStyleConfig = {
      ...baseStyle,
      logo: {
        enabled: true,
        image: 'data:image/png;base64,mockLogo',
        position: 'bottom-right',
        size: 'md',
        opacity: 0.85,
      },
    };
    render(<CardPreview card={mockCard} style={styleWithLogo} />);
    const logoImg = screen.getByAltText('Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg.getAttribute('src')).toBe('data:image/png;base64,mockLogo');

    const logoContainer = logoImg.parentElement;
    expect(logoContainer?.className).toContain('bottom-1.5 right-1.5');
    expect(logoContainer?.style.opacity).toBe('0.85');
  });
});
