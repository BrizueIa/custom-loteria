import { LoteriaCard } from '../types/loteria';

/**
 * Generates a clean, modern placeholder SVG for empty/cleared cards
 * Designed to act as an inviting photo upload dropzone inside the card frame
 */
export function createCleanCardPlaceholder(cardName?: string, cardNumber?: number): string {
  const titleText = cardName ? cardName.toUpperCase() : 'CARTA';
  const numText = cardNumber === 0 ? '(PORTADA)' : cardNumber ? `#${cardNumber}` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380" width="100%" height="100%">
    <rect width="100%" height="100%" fill="#FAF7F2" rx="8" />
    <rect x="8" y="8" width="284" height="364" rx="6" fill="none" stroke="#D6CEBE" stroke-width="1.5" stroke-dasharray="6 4" />
    <g transform="translate(150, 175)">
      <!-- Camera / Image Placeholder Icon -->
      <circle cx="0" cy="0" r="44" fill="#EFE8DC" />
      <path d="M-18 -8 L-13 -16 L13 -16 L18 -8 L24 -8 A4 4 0 0 1 28 -4 L28 16 A4 4 0 0 1 24 20 L-24 20 A4 4 0 0 1 -28 16 L-28 -4 A4 4 0 0 1 -24 -8 Z" fill="#8C7A6B" />
      <circle cx="0" cy="6" r="9" fill="#EFE8DC" />
      <circle cx="0" cy="6" r="6" fill="#8C7A6B" />
      <circle cx="16" cy="-4" r="2.5" fill="#F59E0B" />
      <!-- Prompt text -->
      <text x="0" y="65" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle" fill="#786B5E">
        Toca para agregar foto
      </text>
      <text x="0" y="82" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="500" font-size="10" text-anchor="middle" fill="#A89F91">
        ${titleText} ${numText}
      </text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 54 Traditional Mexican Loteria Cards with rhyming taglines and colorful vector emblems
export const TRADITIONAL_LOTERIA_DECK: Array<{ name: string; tag: string; emoji: string; bg: string; accent: string }> = [
  { name: "El Gallo", tag: "El que le cantó a San Pedro no le volverá a cantar", emoji: "🐓", bg: "#FEF2F2", accent: "#DC2626" },
  { name: "El Diablo", tag: "Pórtate bien cuatito, que te lleva el coloradito", emoji: "😈", bg: "#FFF1F2", accent: "#E11D48" },
  { name: "La Sirena", tag: "Medio pez y medio mujer, con su canto a perder", emoji: "🧜‍♀️", bg: "#F0FDFA", accent: "#0D9488" },
  { name: "La Dama", tag: "Puliendo el paso por toda la calle real", emoji: "💃", bg: "#FDF2F8", accent: "#DB2777" },
  { name: "El Catrín", tag: "Don Ferruco en la alameda, su bastón quería tirar", emoji: "🎩", bg: "#F8FAFC", accent: "#475569" },
  { name: "El Paraguas", tag: "Para el sol y para el agua", emoji: "☂️", bg: "#EFF6FF", accent: "#2563EB" },
  { name: "La Escalera", tag: "Súbeme paso a pasito, no quieras arrebatar", emoji: "🪜", bg: "#FFFBEB", accent: "#D97706" },
  { name: "La Botella", tag: "La herramienta del borracho para ahogar su pesar", emoji: "🍾", bg: "#F0FDF4", accent: "#16A34A" },
  { name: "El Barril", tag: "Tanto bebió el albañil, que quedó como un barril", emoji: "🛢️", bg: "#FFF7ED", accent: "#EA580C" },
  { name: "El Árbol", tag: "El que a buen árbol se arrima, buena sombra le cobija", emoji: "🌳", bg: "#F0FDF4", accent: "#15803D" },
  { name: "El Melón", tag: "Me lo das o me lo quitas, corazón", emoji: "🍈", bg: "#FEFCE8", accent: "#CA8A04" },
  { name: "El Valiente", tag: "Por qué le corres cobarde, trayendo tan buen puñal", emoji: "🗡️", bg: "#FFF1F2", accent: "#BE123C" },
  { name: "El Gorrito", tag: "Ponle su gorrito al nene, no se vaya a resfriar", emoji: "🧢", bg: "#EFF6FF", accent: "#3B82F6" },
  { name: "La Muerte", tag: "La muerte siriquisiaca, la calaca tilica y flaca", emoji: "💀", bg: "#F8FAFC", accent: "#334155" },
  { name: "La Pera", tag: "El que espera desespera, y se come una rica pera", emoji: "🍐", bg: "#F7FEE7", accent: "#65A30D" },
  { name: "La Bandera", tag: "Verde, blanco y colorado, la bandera del soldado", emoji: "🇲🇽", bg: "#FEF2F2", accent: "#B91C1C" },
  { name: "El Bandolón", tag: "Tocando alegre su son en la fiesta del mesón", emoji: "🪕", bg: "#FFFBEB", accent: "#B45309" },
  { name: "El Violoncello", tag: "Creciendo se fue hasta el cielo con notas de terciopelo", emoji: "🎻", bg: "#FFF7ED", accent: "#C2410C" },
  { name: "La Garza", tag: "Al otro lado del río tengo mi garza querida", emoji: "🦩", bg: "#F0FDFA", accent: "#0F766E" },
  { name: "El Pájaro", tag: "Tú me traes a paso largo, pajarito de la selva", emoji: "🦜", bg: "#F0FDF4", accent: "#059669" },
  { name: "La Mano", tag: "La mano del buen amigo nunca te defraudará", emoji: "✋", bg: "#FEF3C7", accent: "#D97706" },
  { name: "La Bota", tag: "Una bota es muy bonita y resiste el tropezón", emoji: "👢", bg: "#FFF7ED", accent: "#9A3412" },
  { name: "La Luna", tag: "El farol de los amantes que alumbra por el callejón", emoji: "🌙", bg: "#F8FAFC", accent: "#1E293B" },
  { name: "El Cotorro", tag: "Cotorro da acá la pata y empiézame a platicar", emoji: "🦜", bg: "#ECFDF5", accent: "#10B981" },
  { name: "El Borracho", tag: "¡Ay, qué borracho vengo yo, tambaleando de emoción!", emoji: "🥴", bg: "#FFFBEB", accent: "#F59E0B" },
  { name: "El Negrito", tag: "Con su canasta cantando alegre al caminar", emoji: "👦", bg: "#F1F5F9", accent: "#475569" },
  { name: "El Corazón", tag: "No me extrañes, corazón, que al ratito vuelvo yo", emoji: "❤️", bg: "#FEF2F2", accent: "#EF4444" },
  { name: "La Sandía", tag: "La fruta fresca y jugosa para la calor del día", emoji: "🍉", bg: "#FEF2F2", accent: "#E11D48" },
  { name: "El Tambor", tag: "No te arrugues cuero viejo, que te quiero pa' tambor", emoji: "🥁", bg: "#FEF3C7", accent: "#B45309" },
  { name: "El Camarón", tag: "Camarón que se duerme se lo lleva la corriente", emoji: "🦐", bg: "#FFF1F2", accent: "#F43F5E" },
  { name: "Las Jaras", tag: "Las flechas del indio bravo que certero da al blancor", emoji: "🏹", bg: "#FFF7ED", accent: "#C2410C" },
  { name: "El Músico", tag: "Toca que toca en la plaza su alegre melodía", emoji: "🎺", bg: "#EFF6FF", accent: "#2563EB" },
  { name: "La Araña", tag: "Atarántamela a palos, no la dejes caminar", emoji: "🕷️", bg: "#F8FAFC", accent: "#334155" },
  { name: "El Soldado", tag: "Uno, dos y tres marcha al revés con paso firme", emoji: "🪖", bg: "#F0FDF4", accent: "#166534" },
  { name: "La Estrella", tag: "La guía de los marineros en la noche sin final", emoji: "⭐", bg: "#FEFCE8", accent: "#EAB308" },
  { name: "El Cazo", tag: "El cazo que te hago es poco, pero con amor de coco", emoji: "🍳", bg: "#FFFBEB", accent: "#D97706" },
  { name: "El Mundo", tag: "Este mundo es una bola y nosotros la pelota", emoji: "🌍", bg: "#EFF6FF", accent: "#0284C7" },
  { name: "El Apache", tag: "Con sus plumas en la frente vigilando el cañón", emoji: "🪶", bg: "#FFF7ED", accent: "#EA580C" },
  { name: "El Nopal", tag: "Al que van a ver solo cuando tiene tunas", emoji: "🌵", bg: "#ECFDF5", accent: "#047857" },
  { name: "El Alacrán", tag: "El que brinca de repente y te clava su aguijón", emoji: "🦂", bg: "#FFFBEB", accent: "#B45309" },
  { name: "La Rosa", tag: "Rosita, Rosaura, la flor más bella del vergel", emoji: "🌹", bg: "#FFF1F2", accent: "#E11D48" },
  { name: "La Calavera", tag: "Al pasar por el panteón me encontré una calavera", emoji: "💀", bg: "#F8FAFC", accent: "#475569" },
  { name: "La Campana", tag: "La campana de la iglesia que llama a la fiesta", emoji: "🔔", bg: "#FEFCE8", accent: "#CA8A04" },
  { name: "El Cantarito", tag: "El cantarito del agua, fresco como la mañana", emoji: "🏺", bg: "#FFF7ED", accent: "#C2410C" },
  { name: "El Venado", tag: "Brincando por las montañas con agilidad", emoji: "🦌", bg: "#FEF3C7", accent: "#B45309" },
  { name: "El Sol", tag: "La cobija de los pobres que alumbra por igual", emoji: "☀️", bg: "#FEFCE8", accent: "#F59E0B" },
  { name: "La Corona", tag: "El sombrero de los reyes con perlas y rubí", emoji: "👑", bg: "#FEF9C3", accent: "#CA8A04" },
  { name: "La Chalupa", tag: "Rema y rema va Lupita en su chalupa de flores", emoji: "🛶", bg: "#F0FDFA", accent: "#0D9488" },
  { name: "El Pino", tag: "Fresco, verde y oloroso, en todo tiempo frondoso", emoji: "🌲", bg: "#F0FDF4", accent: "#166534" },
  { name: "El Pescado", tag: "El que por la boca muere y en la red queda preso", emoji: "🐟", bg: "#EFF6FF", accent: "#3B82F6" },
  { name: "La Palma", tag: "Palmero sube a la palma y bájame un coco de agua", emoji: "🌴", bg: "#ECFDF5", accent: "#059669" },
  { name: "La Maceta", tag: "El que nace pa' maceta, del corredor no pasa", emoji: "🪴", bg: "#FFFBEB", accent: "#D97706" },
  { name: "El Arpa", tag: "Arpa de notas doradas que tocan en el fandango", emoji: "🪗", bg: "#FFF7ED", accent: "#C2410C" },
  { name: "La Rana", tag: "Al brinco y brinco en el charco cantando feliz", emoji: "🐸", bg: "#F0FDF4", accent: "#15803D" }
];

function generateLoteriaCardSVG(num: number, _name: string, emoji: string, bg: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380" width="100%" height="100%">
    <defs>
      <linearGradient id="cardGrad${num}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
      <filter id="shadow${num}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.10"/>
      </filter>
    </defs>

    <!-- Warm parchment card background -->
    <rect width="100%" height="100%" fill="url(#cardGrad${num})" rx="10" />

    <!-- Delicate inner border -->
    <rect x="8" y="8" width="284" height="364" rx="8" fill="none" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.35" />

    <!-- Centerpiece Medallion -->
    <g transform="translate(150, 180)" filter="url(#shadow${num})">
      <circle cx="0" cy="0" r="75" fill="#FFFFFF" stroke="${accent}" stroke-width="2.5" stroke-opacity="0.25" />
      <circle cx="0" cy="0" r="68" fill="${bg}" opacity="0.6" />
      
      <!-- Central Emblem Glyph / Symbol -->
      <text x="0" y="24" font-size="64" text-anchor="middle" font-family="'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif">
        ${emoji}
      </text>
    </g>

    <!-- Bottom decorative badge -->
    <g transform="translate(150, 340)">
      <text x="0" y="0" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="11" text-anchor="middle" fill="${accent}" letter-spacing="2">
        LOTERÍA MEXICANA
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_COVER_CARD: LoteriaCard = {
  id: 'card-0',
  number: 0,
  isCover: true,
  name: 'Lotería Mexicana',
  tagline: '',
  backgroundColor: '#FEF3C7',
  image: generateLoteriaCardSVG(0, 'Lotería Mexicana', '🎴', '#FEF3C7', '#B45309')
};

export const DEFAULT_CARDS: LoteriaCard[] = [
  DEFAULT_COVER_CARD,
  ...TRADITIONAL_LOTERIA_DECK.map((item, idx) => {
    const num = idx + 1;
    return {
      id: `card-${num}`,
      number: num,
      name: item.name,
      tagline: item.tag,
      backgroundColor: item.bg,
      image: generateLoteriaCardSVG(num, item.name, item.emoji, item.bg, item.accent)
    };
  })
];

/**
 * Ensures any loaded or imported deck has a cover card (number 0) at the beginning
 */
export function ensureDeckHasCoverCard(cards: LoteriaCard[]): LoteriaCard[] {
  if (!Array.isArray(cards) || cards.length === 0) return DEFAULT_CARDS;
  const hasCover = cards.some(c => c.number === 0 || c.isCover);
  if (hasCover) {
    return [...cards]
      .map(c => (c.number === 0 || c.isCover ? { ...c, number: 0, isCover: true } : c))
      .sort((a, b) => a.number - b.number);
  }
  return [DEFAULT_COVER_CARD, ...cards].sort((a, b) => a.number - b.number);
}
