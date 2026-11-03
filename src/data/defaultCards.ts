import { LoteriaCard } from '../types/loteria';

function generatePlaceholderCardSVG(
  _name: string,
  num: number,
  type: string,
  cardTint: { bg: string; pot: string; plant: string; accent: string; pattern?: string }
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad${num}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${cardTint.bg}" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
      <filter id="shadow${num}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" flood-opacity="0.12"/>
      </filter>
    </defs>

    <!-- Warm colorful card background -->
    <rect width="100%" height="100%" fill="url(#bgGrad${num})" rx="12" />

    <!-- Delicate inner border -->
    <rect x="14" y="14" width="372" height="492" rx="8" fill="none" stroke="${cardTint.pot}" stroke-width="1.5" stroke-opacity="0.3" />

    <!-- Centerpiece -->
    <g transform="translate(200, 275)" filter="url(#shadow${num})">
      <!-- Shadow below base -->
      <ellipse cx="0" cy="115" rx="55" ry="12" fill="#2d3748" opacity="0.15" />

      <!-- Pot with festive design -->
      <polygon points="-44,45 -34,112 34,112 44,45" fill="${cardTint.pot}" />
      <rect x="-50" y="34" width="100" height="15" rx="4" fill="${cardTint.pot}" filter="brightness(1.15)" />
      
      <!-- Decorative band on base -->
      <rect x="-40" y="62" width="80" height="8" rx="2" fill="${cardTint.accent}" opacity="0.8" />
      <circle cx="-16" cy="66" r="2.5" fill="#FFFFFF" />
      <circle cx="0" cy="66" r="2.5" fill="#FFFFFF" />
      <circle cx="16" cy="66" r="2.5" fill="#FFFFFF" />

      <!-- Center artwork based on type -->
      ${getPlaceholderArtwork(type, cardTint.plant, cardTint.accent)}
    </g>

    <!-- Subtitle tag -->
    <text x="200" y="475" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="11" text-anchor="middle" fill="#57534E" letter-spacing="2.5">
      LOTERÍA MEXICANA
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getPlaceholderArtwork(type: string, green: string, accent: string): string {
  switch (type) {
    case 'monstera':
      return `
        <!-- Stems -->
        <path d="M0,45 Q-20,-10 -65,-40" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M0,45 Q20,-20 65,-45" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M0,45 Q0,-30 0,-100" stroke="${green}" stroke-width="5" fill="none" stroke-linecap="round"/>
        
        <!-- Center leaf -->
        <g transform="translate(0, -100)">
          <path d="M0,0 C-75,-15 -85,-85 0,-130 C85,-85 75,-15 0,0 Z" fill="${green}" />
          <ellipse cx="-35" cy="-65" rx="5" ry="18" transform="rotate(-30, -35, -65)" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="35" cy="-65" rx="5" ry="18" transform="rotate(30, 35, -65)" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="-20" cy="-95" rx="4" ry="14" transform="rotate(-15, -20, -95)" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="20" cy="-95" rx="4" ry="14" transform="rotate(15, 20, -95)" fill="#FFFFFF" opacity="0.9" />
        </g>
        <g transform="translate(-65, -40) rotate(-25)">
          <path d="M0,0 C-50,-10 -60,-60 0,-90 C60,-60 50,-10 0,0 Z" fill="${green}" filter="brightness(0.9)" />
          <ellipse cx="-22" cy="-45" rx="4" ry="12" transform="rotate(-25, -22, -45)" fill="#FFFFFF" opacity="0.9" />
        </g>
        <g transform="translate(65, -45) rotate(25)">
          <path d="M0,0 C-50,-10 -60,-60 0,-90 C60,-60 50,-10 0,0 Z" fill="${green}" filter="brightness(1.1)" />
          <ellipse cx="22" cy="-45" rx="4" ry="12" transform="rotate(25, 22, -45)" fill="#FFFFFF" opacity="0.9" />
        </g>
      `;

    case 'cactus':
      return `
        <rect x="-24" y="-120" width="48" height="165" rx="24" fill="${green}" />
        <path d="M-24,-40 H-54 V-105 H-34 V-60 H-24" fill="${green}" />
        <path d="M24,-15 H54 V-80 H34 V-35 H24" fill="${green}" />
        <line x1="-10" y1="-115" x2="-10" y2="40" stroke="#FFFFFF" stroke-width="2" opacity="0.25" stroke-dasharray="8,6" />
        <line x1="10" y1="-115" x2="10" y2="40" stroke="#FFFFFF" stroke-width="2" opacity="0.25" stroke-dasharray="8,6" />
        <circle cx="0" cy="-125" r="14" fill="${accent}" />
        <circle cx="0" cy="-125" r="7" fill="#FDE047" />
        <circle cx="-5" cy="-128" r="3" fill="#FFFFFF" />
      `;

    case 'succulent':
      return `
        <g transform="translate(0, 40)">
          ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => `
            <path d="M0,0 C-22,-20 -28,-65 0,-85 C28,-65 22,-20 0,0 Z" transform="rotate(${deg})" fill="${green}" filter="brightness(0.95)" />
          `).join('')}
          ${[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => `
            <path d="M0,0 C-15,-15 -20,-48 0,-65 C20,-48 15,-15 0,0 Z" transform="rotate(${deg})" fill="${green}" filter="brightness(1.15)" />
          `).join('')}
          <circle cx="0" cy="0" r="12" fill="${accent}" opacity="0.8" />
        </g>
      `;

    case 'snake':
      return `
        <g transform="translate(0, 45)">
          <path d="M-22,0 Q-40,-100 -20,-185 Q-5,-100 -10,0 Z" fill="${green}" filter="brightness(0.85)" />
          <path d="M-6,0 Q-5,-120 0,-220 Q18,-120 12,0 Z" fill="${green}" filter="brightness(1.15)" />
          <path d="M-6,0 Q-5,-120 0,-220 Q18,-120 12,0" stroke="#FDE047" stroke-width="3" fill="none" />
          <path d="M10,0 Q32,-90 25,-175 Q15,-90 5,0 Z" fill="${green}" />
          <line x1="-3" y1="-80" x2="8" y2="-80" stroke="#14532D" stroke-width="4" stroke-linecap="round" />
          <line x1="-2" y1="-140" x2="5" y2="-140" stroke="#14532D" stroke-width="4" stroke-linecap="round" />
        </g>
      `;

    case 'fern':
      return `
        <g transform="translate(0, 45)">
          <path d="M0,0 Q-70,-30 -115,-10" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round" />
          <path d="M0,0 Q70,-30 115,-10" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round" />
          <path d="M0,0 Q-50,-80 -80,-155" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round" />
          <path d="M0,0 Q50,-80 80,-155" stroke="${green}" stroke-width="4" fill="none" stroke-linecap="round" />
          <path d="M0,0 Q0,-90 0,-185" stroke="${green}" stroke-width="5" fill="none" stroke-linecap="round" />
          ${[-35, -65, -95, -125, -155].map(y => `
            <ellipse cx="-16" cy="${y}" rx="14" ry="5" transform="rotate(-25, -16, ${y})" fill="${green}" />
            <ellipse cx="16" cy="${y}" rx="14" ry="5" transform="rotate(25, 16, ${y})" fill="${green}" />
          `).join('')}
        </g>
      `;

    case 'poinsettia':
      return `
        <g transform="translate(0, 40)">
          <ellipse cx="-45" cy="-25" rx="20" ry="45" transform="rotate(-40, -45, -25)" fill="#166534" />
          <ellipse cx="45" cy="-25" rx="20" ry="45" transform="rotate(40, 45, -25)" fill="#166534" />
          ${[0, 60, 120, 180, 240, 300].map(deg => `
            <path d="M0,0 C-18,-20 -24,-65 0,-95 C24,-65 18,-20 0,0 Z" transform="rotate(${deg})" fill="${accent}" />
          `).join('')}
          <circle cx="-4" cy="-4" r="5" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5" />
          <circle cx="5" cy="-3" r="5" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5" />
          <circle cx="0" cy="5" r="5" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5" />
        </g>
      `;

    default:
      return `
        <g transform="translate(0, 40)">
          <ellipse cx="-40" cy="-60" rx="24" ry="55" transform="rotate(-30, -40, -60)" fill="${green}" filter="brightness(0.9)" />
          <ellipse cx="40" cy="-60" rx="24" ry="55" transform="rotate(30, 40, -60)" fill="${green}" filter="brightness(1.1)" />
          <ellipse cx="0" cy="-100" rx="28" ry="70" fill="${green}" />
          <circle cx="0" cy="-125" r="16" fill="${accent}" />
          <circle cx="0" cy="-125" r="7" fill="#FDE047" />
        </g>
      `;
  }
}

// Warm, joyful card tints
const CARD_PALETTES = [
  { bg: '#EBF6EC', pot: '#C2410C', plant: '#15803D', accent: '#DC2626' },
  { bg: '#FEF9EB', pot: '#B45309', plant: '#166534', accent: '#E11D48' },
  { bg: '#EBF5FA', pot: '#0F766E', plant: '#047857', accent: '#D97706' },
  { bg: '#FDF2F4', pot: '#9F1239', plant: '#166534', accent: '#BE123C' },
  { bg: '#F5EEF9', pot: '#7C3AED', plant: '#065F46', accent: '#F59E0B' },
  { bg: '#FFF4E8', pot: '#EA580C', plant: '#15803D', accent: '#C026D3' },
];

const sampleDeckCards: Array<{ name: string; tag: string; type: string }> = [
  { name: "La Monstera", tag: "¡El rey de la sala con sus hojas rotas!", type: "monstera" },
  { name: "La Nochebuena", tag: "¡La reina roja de la posada y el jardín!", type: "poinsettia" },
  { name: "El Cactus Órgano", tag: "¡Pica pero decora con orgullo!", type: "cactus" },
  { name: "La Suculenta Gordita", tag: "¡Mírame y no me riegues!", type: "succulent" },
  { name: "La Lengua de Suegra", tag: "¡Indestructible y con carácter!", type: "snake" },
  { name: "El Palo de Brasil", tag: "¡Tronco fuerte y buenas vibras!", type: "generic" },
  { name: "La Cuna de Moisés", tag: "¡La dramática que pide agua!", type: "generic" },
  { name: "El Potos Colgante", tag: "¡Va trepando por las cortinas!", type: "fern" },
  { name: "El Helecho Boston", tag: "¡Melena verde y despeinada!", type: "fern" },
  { name: "El Ficus Lyrata", tag: "¡La consentida de Instagram!", type: "monstera" },
  { name: "El Anturio Rojo", tag: "¡Flor brillante todo el año!", type: "poinsettia" },
  { name: "La Corona de Cristo", tag: "¡Espinas y florecitas rosas!", type: "cactus" },
  { name: "La Zamioculca", tag: "¡Ni la falta de luz la acaba!", type: "snake" },
  { name: "La Mala Madre", tag: "¡Llena de hijitos por doquier!", type: "fern" },
  { name: "La Calatea Medallón", tag: "¡Baila y reza al anochecer!", type: "generic" },
  { name: "La Pilea del Dinero", tag: "¡Moneditas verdes en la mesa!", type: "succulent" },
  { name: "El Ave del Paraíso", tag: "¡Alas tropicales en el jardín!", type: "generic" },
  { name: "El Árbol de Jade", tag: "¡Para atraer la prosperidad!", type: "succulent" },
  { name: "El Vaporub", tag: "¡Huélela y destapa el pecho!", type: "succulent" },
  { name: "El Teléfono", tag: "¡Hojas verdes que se comunican!", type: "fern" },
  { name: "La Violeta Africana", tag: "¡Pétalos de terciopelo!", type: "succulent" },
  { name: "El Romerito", tag: "¡Para el guiso y el té caliente!", type: "fern" },
  { name: "La Ruda", tag: "¡Contra las malas vibras de la vecina!", type: "generic" },
  { name: "La Sábila", tag: "¡Para el cabello, la piel y el susto!", type: "snake" },
  { name: "El Geranio", tag: "¡El que adorna el balcón con flores!", type: "generic" },
  { name: "La Bugambilia", tag: "¡Cascada fucsia en la barda!", type: "fern" },
  { name: "El Singonio", tag: "¡Hojas flecha color pastel!", type: "generic" },
  { name: "El Collar de Perlas", tag: "¡Canicas verdes colgando!", type: "fern" },
  { name: "La Begonia Maculata", tag: "¡Vestido verde a lunares blancos!", type: "monstera" },
  { name: "El Bonsái", tag: "¡Paciencia pura y recorte fino!", type: "generic" },
  { name: "El Bambú de la Suerte", tag: "¡En agua y con listón rojo!", type: "snake" },
  { name: "La Lavanda", tag: "¡Perfume para dormir tranquilos!", type: "fern" },
  { name: "La Hierbabuena", tag: "¡Frescura para el mole o mojito!", type: "fern" },
  { name: "El Albahaca", tag: "¡Hojas aromáticas para la salsa!", type: "generic" },
  { name: "El Tomillo", tag: "¡Pequeñito pero rendidor!", type: "fern" },
  { name: "La Monstera Adansonii", tag: "¡El queso suizo del reino vegetal!", type: "monstera" },
  { name: "El Dólar Negro", tag: "¡Hojas oscuras de misterio!", type: "generic" },
  { name: "La Peperomia", tag: "¡Hojas de sandía redonditas!", type: "succulent" },
  { name: "El Coleus Arcoíris", tag: "¡Fiesta de colores en cada hoja!", type: "generic" },
  { name: "El Senecio Azul", tag: "¡Tizas azules al pleno sol!", type: "succulent" },
  { name: "El Clavel del Aire", tag: "¡Ni maceta necesita la presumida!", type: "fern" },
  { name: "La Rosa Mística", tag: "¡La flor del amor con espina!", type: "poinsettia" },
  { name: "El Crotón Fuego", tag: "¡Amarillo, naranja y rojo volcán!", type: "generic" },
  { name: "El Agave Tequilero", tag: "¡Para brindar con mezcal y tequila!", type: "snake" },
  { name: "El Biznaguita", tag: "¡Cactus redondito como pelota!", type: "cactus" },
  { name: "La Hiedra Trepadora", tag: "¡Se adueña de la fachada!", type: "fern" },
  { name: "El Nopalito", tag: "¡Con sus tunas y espinas patrias!", type: "cactus" },
  { name: "La Orquídea Consentida", tag: "¡Que no le dé aire ni le hables feo!", type: "generic" },
  { name: "El Jazmín de Noche", tag: "¡Huele a gloria al oscurecer!", type: "generic" },
  { name: "La Hortensia Azul", tag: "¡Pompones gigantes de jardín!", type: "generic" },
  { name: "El Culantrillo", tag: "¡Follaje delicado como encaje!", type: "fern" },
  { name: "El Palo de Agua", tag: "¡A limpiar hojas los domingos!", type: "generic" },
  { name: "El Crisantemo", tag: "¡Flores copiosas y alegres!", type: "poinsettia" },
  { name: "El Regador de Oro", tag: "¡El arma secreta!", type: "generic" }
];

export const DEFAULT_CARDS: LoteriaCard[] = sampleDeckCards.map((item, idx) => {
  const num = idx + 1;
  const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
  return {
    id: `card-${num}`,
    number: num,
    name: item.name,
    tagline: item.tag,
    image: generatePlaceholderCardSVG(item.name, num, item.type, palette)
  };
});
