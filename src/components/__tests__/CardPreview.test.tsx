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
    expect(logoContainer?.style.width).toBe('15%');
  });

  it('renders logo with xs (mini) and custom scale', () => {
    const styleWithMiniLogo: CardStyleConfig = {
      ...baseStyle,
      logo: {
        enabled: true,
        image: 'data:image/png;base64,mockLogo',
        position: 'top-right',
        size: 'xs',
        scale: 0.08,
        opacity: 0.9,
      },
    };
    render(<CardPreview card={mockCard} style={styleWithMiniLogo} />);
    const logoImg = screen.getByAltText('Logo');
    const logoContainer = logoImg.parentElement;
    expect(logoContainer?.className).toContain('top-1.5 right-1.5');
    expect(logoContainer?.style.width).toBe('8%');
  });

  it('applies custom outerMarginColor and isFlush styling correctly', () => {
    const { container } = render(
      <CardPreview
        card={mockCard}
        style={baseStyle}
        outerMarginColor="#DCFCE7"
        isFlush={true}
        isCompactTable={true}
      />
    );
    const outerCardDiv = container.firstChild as HTMLElement;
    expect(outerCardDiv.style.backgroundColor).toBe('rgb(220, 252, 231)'); // #DCFCE7
    expect(outerCardDiv.className).toContain('p-0');
  });

  it('strictly respects white text (#FFFFFF) even on high luminance background', () => {
    const cardWithPinkBg: LoteriaCard = {
      ...mockCard,
      backgroundColor: '#FD8FB2', // light pink (high luminance)
    };
    const whiteTextStyle: CardStyleConfig = {
      ...baseStyle,
      textColor: '#FFFFFF',
    };
    render(<CardPreview card={cardWithPinkBg} style={whiteTextStyle} />);
    const nameEl = screen.getByText('El Gallo');
    expect(nameEl.style.color).toBe('rgb(255, 255, 255)');
  });

  it('renders outer border delimiting the card on board when cardOuterBorderColor is set', () => {
    const blackBorderStyle: CardStyleConfig = {
      ...baseStyle,
      cardOuterBorderColor: '#141413',
    };
    const { container } = render(
      <CardPreview card={mockCard} style={blackBorderStyle} variant="board" />
    );
    const outerCardDiv = container.firstChild as HTMLElement;
    expect(outerCardDiv.className).toContain('border');
    expect(outerCardDiv.style.borderColor).toBe('rgb(20, 20, 19)');
  });

  it('blends margin with board background in match_board mode', () => {
    const matchBoardStyle: CardStyleConfig = {
      ...baseStyle,
      cardOuterMarginMode: 'match_board',
      cardOuterMarginColor: '#FF0000',
    };
    const { container } = render(
      <CardPreview
        card={mockCard}
        style={matchBoardStyle}
        variant="board"
        outerMarginColor="#FEF08A" // yellow board
      />
    );
    const outerCardDiv = container.firstChild as HTMLElement;
    // On board, it absorbs the yellow board background
    expect(outerCardDiv.style.backgroundColor).toBe('rgb(254, 240, 138)');
  });

  it('renders rounded corners on outer and inner containers when cardCornerRadius is set', () => {
    const roundedStyle: CardStyleConfig = {
      ...baseStyle,
      cardCornerRadius: 'md',
    };
    const { container } = render(<CardPreview card={mockCard} style={roundedStyle} />);
    const outerCardDiv = container.firstChild as HTMLElement;
    expect(outerCardDiv.className).toContain('rounded-2xl');

    const innerDiv = outerCardDiv.firstChild as HTMLElement;
    expect(innerDiv.className).toContain('rounded-xl');
  });

  it('applies proportional padding (4.5%) on board variant when not flush', () => {
    const { container } = render(
      <CardPreview card={mockCard} style={baseStyle} variant="board" />
    );
    const outerCardDiv = container.firstChild as HTMLElement;
    expect(outerCardDiv.style.padding).toBe('4.5%');
  });
});
