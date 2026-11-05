import { LoteriaCard, BoardConfig, GeneratedBoard } from '../types/loteria';

/**
 * Fisher-Yates array shuffle (creates a new shuffled copy)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Swaps numbers between two cards when a user changes a number.
 * e.g., if changing card with current number `fromNum` to `targetNum`,
 * the card that currently has `targetNum` receives `fromNum`.
 */
export function swapCardNumbers(
  cards: LoteriaCard[],
  cardId: string,
  targetNum: number
): LoteriaCard[] {
  const currentCard = cards.find(c => c.id === cardId);
  if (!currentCard || currentCard.number === targetNum) return cards;
  if (currentCard.number === 0 || currentCard.isCover || targetNum === 0) return cards;

  const oldNum = currentCard.number;
  const cardWithTargetNum = cards.find(c => c.number === targetNum && c.id !== cardId);

  return cards.map(c => {
    if (c.id === cardId) {
      return { ...c, number: targetNum };
    }
    if (cardWithTargetNum && c.id === cardWithTargetNum.id) {
      return { ...c, number: oldNum };
    }
    return c;
  }).sort((a, b) => a.number - b.number);
}

/**
 * Generates N unique boards based on the user's BoardConfig.
 * Ensures:
 * 1. Each board has rows * cols cards.
 * 2. If allowDuplicates = false, no card repeats in the same board.
 * 3. Each board has a unique combination of cards (no duplicate boards).
 * 4. Balanced distribution: tries to use cards fairly.
 */
export function generateBoards(
  deck: LoteriaCard[],
  config: BoardConfig
): GeneratedBoard[] {
  // Exclude Cover / Portada card (number === 0 or isCover) from playable board cells
  const playableDeck = deck.filter(c => c.number > 0 && !c.isCover);
  const cellsPerBoard = config.rows * config.cols;
  const totalCards = playableDeck.length;

  if (totalCards < cellsPerBoard && !config.allowDuplicates) {
    throw new Error(
      `No es posible generar una tabla de ${cellsPerBoard} casillas sin repetir con solo ${totalCards} cartas disponibles.`
    );
  }

  const generatedBoards: GeneratedBoard[] = [];
  const existingSignatures = new Set<string>();

  // Card usage counter to encourage balanced distribution
  const cardFrequency: Record<string, number> = {};
  playableDeck.forEach(c => (cardFrequency[c.id] = 0));

  let attempts = 0;
  const maxAttempts = config.quantity * 200;

  while (generatedBoards.length < config.quantity && attempts < maxAttempts) {
    attempts++;
    let boardCards: LoteriaCard[] = [];

    if (!config.allowDuplicates) {
      // Pick `cellsPerBoard` distinct cards from playableDeck
      // Sort deck lightly biased by lower frequency of usage
      const weightedDeck = [...playableDeck].sort((a, b) => {
        const freqA = cardFrequency[a.id] + Math.random() * 2;
        const freqB = cardFrequency[b.id] + Math.random() * 2;
        return freqA - freqB;
      });

      // Take the first cellsPerBoard and shuffle their placement
      const selectedSubset = weightedDeck.slice(0, cellsPerBoard);
      boardCards = shuffleArray(selectedSubset);
    } else {
      // Duplicates allowed inside the board
      for (let i = 0; i < cellsPerBoard; i++) {
        const randomCard = playableDeck[Math.floor(Math.random() * totalCards)];
        boardCards.push(randomCard);
      }
    }

    // Generate a unique fingerprint for this board (sorted IDs for combination, or exact placement)
    const signature = boardCards.map(c => c.id).join('-');

    if (!existingSignatures.has(signature)) {
      existingSignatures.add(signature);
      
      // Update frequencies
      boardCards.forEach(c => {
        cardFrequency[c.id] = (cardFrequency[c.id] || 0) + 1;
      });

      generatedBoards.push({
        id: `board-${generatedBoards.length + 1}`,
        index: generatedBoards.length + 1,
        cards: boardCards
      });
    }
  }

  return generatedBoards;
}
