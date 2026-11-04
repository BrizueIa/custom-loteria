export interface LoteriaCard {
  id: string;
  number: number; // 1 to 54
  name: string;
  image: string; // Base64 data URL, SVG data URL, or URL
  tagline?: string; // Optional verse or humorous subtitle
}

export type FrameStyle = 
  | 'talavera'          // Traditional Mexican Talavera ceramic filigree corners
  | 'botanical_litho'   // 19th Century Herbarium / Botanical lithograph with ornamental corners
  | 'editorial_luxury'  // Clean, high-end Swiss gallery design with delicate registration marks
  | 'classic_loteria'   // Bold Mexican printmaker retro linocut with corner diamonds
  | 'organic_floral';   // Fine line botanical vine border

export type NumberPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type NamePosition = 'bottom' | 'top';

export interface CardStyleConfig {
  frameStyle: FrameStyle;
  numberPosition: NumberPosition;
  namePosition: NamePosition;
  showTaglineOnCard: boolean;
  borderColor: string;
  cardBgColor: string;
  textColor: string;
  fontFamily: 'serif' | 'sans' | 'display';
}

export type BoardFrameStyle = 
  | 'traditional_gallo'  // Clásico tradicional con doble ribete y remates
  | 'festive_banner'     // Cabecera destacada tipo cartel de feria
  | 'talavera_frame'     // Marco con esquinas ornamentales Talavera
  | 'clean_minimal'      // Marco fino limpio moderno
  | 'none';              // Sin marco exterior

export interface BoardConfig {
  rows: number;
  cols: number;
  allowDuplicates: boolean;
  quantity: number;
  title: string;
  subtitle?: string;
  showBoardNumber?: boolean;
  boardFrameStyle?: BoardFrameStyle;
  boardBorderColor?: string;
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
