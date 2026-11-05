export interface LoteriaCard {
  id: string;
  number: number; // 0 for Cover/Portada card (no visible number), 1 to 54 for game cards
  name: string;
  image: string; // Base64 data URL, SVG data URL, or URL
  tagline?: string; // Optional verse or humorous subtitle
  backgroundColor?: string; // Per-card background color absorbed via eyedropper or auto-detected
  featherEdges?: boolean; // Smoothly blend image outer edges into card backgroundColor
  isCover?: boolean; // True when this card is the deck Cover / Portada (printed, not played)
}

export type FrameStyle = 
  | 'talavera'          // Traditional Mexican Talavera ceramic filigree corners
  | 'botanical_litho'   // 19th Century Herbarium / Botanical lithograph with ornamental corners
  | 'editorial_luxury'  // Clean, high-end Swiss gallery design with delicate registration marks
  | 'classic_loteria'   // Bold Mexican printmaker retro linocut with corner diamonds
  | 'organic_floral';   // Fine line botanical vine border

export type NumberPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type NamePosition = 'bottom' | 'top';

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg';

export interface CardLogoConfig {
  enabled: boolean;
  image: string; // Base64 data URL
  position: LogoPosition;
  size: LogoSize;
  scale?: number; // 0.04 to 0.30 (proportional size relative to card width)
  opacity?: number; // 0.1 to 1.0, default 1.0
}

export type CardDimensionPreset = '4_per_page' | '6_per_page' | '9_per_page' | '16_per_page' | 'custom';

export interface CardDimensionsConfig {
  preset: CardDimensionPreset;
  widthCm?: number;
  heightCm?: number;
}

export type CardOuterMarginMode = 'solid' | 'match_board' | 'flush' | 'white' | 'custom';

export interface CardStyleConfig {
  frameStyle: FrameStyle;
  numberPosition: NumberPosition;
  namePosition: NamePosition;
  showTaglineOnCard: boolean;
  borderColor: string;
  cardBgColor: string;
  cardOuterMarginMode?: CardOuterMarginMode; // 'solid' (color fijo), 'match_board' (fusionado con fondo de tabla), 'flush' (al ras)
  cardOuterMarginColor?: string; // Color del margen exterior / paspartú de la carta, default '#FFFFFF'
  cardOuterBorderColor?: string; // Color de la línea perimetral exterior que delimita la tarjeta: '#D6D3D1', '#141413', 'none', o HEX libre
  textColor: string;
  fontFamily: 'serif' | 'sans' | 'display';
  logo?: CardLogoConfig;
  cardDimensions?: CardDimensionsConfig;
}

export type BoardFrameStyle = 
  | 'traditional_gallo'  // Clásico tradicional con doble ribete y remates
  | 'festive_banner'     // Cabecera destacada tipo cartel de feria
  | 'talavera_frame'     // Marco con esquinas ornamentales Talavera
  | 'clean_minimal'      // Marco fino limpio moderno
  | 'none';              // Sin marco exterior

export type BoardDimensionPreset = 'traditional' | 'full_page' | 'half_page' | 'square' | 'custom';

export interface BoardDimensionsConfig {
  preset: BoardDimensionPreset;
  widthCm?: number;
  heightCm?: number;
}

export interface BoardConfig {
  rows: number;
  cols: number;
  allowDuplicates: boolean;
  balanceColors?: boolean;
  quantity: number;
  title: string;
  subtitle?: string;
  showBoardNumber?: boolean;
  boardFrameStyle?: BoardFrameStyle;
  boardBorderColor?: string;
  boardBgColor?: string;
  boardTextColor?: string;
  boardDimensions?: BoardDimensionsConfig;
  cardOuterMarginMode?: CardOuterMarginMode; // Default: 'match_board'
  cardOuterMarginCustomColor?: string;
}

export interface GeneratedBoard {
  id: string;
  index: number;
  cards: LoteriaCard[];
}

export type AppTab = 'generator' | 'game';
export type GeneratorStep = 'cards_input' | 'card_style' | 'board_config' | 'download_pdf';

export interface GameSettings {
  speechVoice: string | null;
  speechRate: number;
  intervalSeconds: number;
  autoAdvance: boolean;
  speakTagline: boolean;
  audioChime: boolean;
}
