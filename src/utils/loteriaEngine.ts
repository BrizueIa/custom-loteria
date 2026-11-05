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

export type ColorGroup = 'pink' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'neutral';

/**
 * Classifies a hex background color into its perceptual color family (Hue/Saturation in HSV).
 * Used to balance color quotas per board and disperse same-colored cards spatially.
 */
export function getCardColorGroup(backgroundColor?: string): ColorGroup {
  if (!backgroundColor) return 'neutral';
  let clean = backgroundColor.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map(ch => ch + ch)
      .join('');
  }
  if (clean.length !== 6) return 'neutral';

  const num = parseInt(clean, 16);
  if (isNaN(num)) return 'neutral';

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const s = max === 0 ? 0 : delta / max;
  if (s < 0.12) return 'neutral';

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  if (h >= 315 || h < 12) return 'pink';
  if (h < 42) return 'orange';
  if (h < 72) return 'yellow';
  if (h < 165) return 'green';
  if (h < 235) return 'blue';
  return 'purple';
}

/**
 * Arranges selected cards on a `rows * cols` grid so that orthogonally adjacent cells
 * (up/down/left/right) do not share the same ColorGroup and diagonal matches are minimized.
 */
export function arrangeCardsWithColorDispersion(
  selectedCards: LoteriaCard[],
  rows: number,
  cols: number,
  colorGroupMap?: Map<string, ColorGroup>
): LoteriaCard[] {
  const n = selectedCards.length;
  if (n <= 1 || rows * cols !== n) return shuffleArray(selectedCards);

  const getGroup = (card: LoteriaCard): ColorGroup =>
    colorGroupMap?.get(card.id) ?? getCardColorGroup(card.backgroundColor);

  const shuffled = shuffleArray(selectedCards);
  const groups = shuffled.map(getGroup);
  const uniqueGroups = new Set(groups);

  // If all cards belong to a single color group (e.g. default white deck), simple shuffle is optimal
  if (uniqueGroups.size <= 1) {
    return shuffled;
  }

  const grid: LoteriaCard[] = new Array(n);
  const gridGroups: ColorGroup[] = new Array(n);
  const used = new Array<boolean>(n).fill(false);
  let nodesVisited = 0;
  const maxNodes = 1200;

  const solve = (pos: number): boolean => {
    if (pos === n) return true;
    nodesVisited++;
    if (nodesVisited > maxNodes) return false;

    const r = Math.floor(pos / cols);
    const c = pos % cols;

    const upGroup = r > 0 ? gridGroups[(r - 1) * cols + c] : null;
    const leftGroup = c > 0 ? gridGroups[r * cols + (c - 1)] : null;
    const diag1Group = r > 0 && c > 0 ? gridGroups[(r - 1) * cols + (c - 1)] : null;
    const diag2Group = r > 0 && c + 1 < cols ? gridGroups[(r - 1) * cols + (c + 1)] : null;

    // Count remaining unused cards per color group (most-constrained / degree heuristic)
    const remainingByGroup: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      if (!used[i]) {
        const g = groups[i];
        remainingByGroup[g] = (remainingByGroup[g] || 0) + 1;
      }
    }

    const candidates: number[] = [];
    for (let i = 0; i < n; i++) {
      if (!used[i] && groups[i] !== upGroup && groups[i] !== leftGroup) {
        candidates.push(i);
      }
    }

    // Sort candidates:
    // 1. Prefer zero diagonal matches with top-left and top-right neighbors
    // 2. Prefer groups that have more remaining unplaced cards so dominant colors don't get trapped at the end
    candidates.sort((a, b) => {
      const ga = groups[a];
      const gb = groups[b];
      const diagA = (ga === diag1Group ? 1 : 0) + (ga === diag2Group ? 1 : 0);
      const diagB = (gb === diag1Group ? 1 : 0) + (gb === diag2Group ? 1 : 0);
      if (diagA !== diagB) return diagA - diagB;
      return (remainingByGroup[gb] || 0) - (remainingByGroup[ga] || 0);
    });

    const triedGroups = new Set<ColorGroup>();
    for (const idx of candidates) {
      const g = groups[idx];
      if (triedGroups.has(g)) continue;
      triedGroups.add(g);

      used[idx] = true;
      grid[pos] = shuffled[idx];
      gridGroups[pos] = g;

      if (solve(pos + 1)) return true;

      used[idx] = false;
    }

    return false;
  };

  if (solve(0)) {
    return grid;
  }

  // Fallback for heavily monochromatic custom decks: greedy swap to minimize adjacent conflicts
  const best = [...shuffled];
  const bestGroups = [...groups];
  const cellConflicts = (idx: number, g: ColorGroup): number => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    let conf = 0;
    if (r > 0 && bestGroups[(r - 1) * cols + c] === g) conf++;
    if (r + 1 < rows && bestGroups[(r + 1) * cols + c] === g) conf++;
    if (c > 0 && bestGroups[r * cols + (c - 1)] === g) conf++;
    if (c + 1 < cols && bestGroups[r * cols + (c + 1)] === g) conf++;
    return conf;
  };

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      if (cellConflicts(i, bestGroups[i]) === 0) continue;
      for (let j = 0; j < n; j++) {
        if (i === j || bestGroups[i] === bestGroups[j]) continue;
        const before = cellConflicts(i, bestGroups[i]) + cellConflicts(j, bestGroups[j]);
        // Swap temporarily
        [best[i], best[j]] = [best[j], best[i]];
        [bestGroups[i], bestGroups[j]] = [bestGroups[j], bestGroups[i]];
        const after = cellConflicts(i, bestGroups[i]) + cellConflicts(j, bestGroups[j]);
        if (after > before) {
          // Revert
          [best[i], best[j]] = [best[j], best[i]];
          [bestGroups[i], bestGroups[j]] = [bestGroups[j], bestGroups[i]];
        }
      }
    }
  }

  return best;
}

/**
 * Generates N unique boards based on the user's BoardConfig.
 * Ensures:
 * 1. Each board has rows * cols cards.
 * 2. If allowDuplicates = false, no card repeats in the same board.
 * 3. Each board has a unique combination of cards (no duplicate boards).
 * 4. Balanced distribution: tries to use cards fairly.
 * 5. Color balance & spatial dispersion (when balanceColors !== false): prevents single-color flooding and adjacent same-colored cards.
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
  const existingCombinations = new Set<string>();

  // Card usage counter to encourage balanced distribution
  const cardFrequency: Record<string, number> = {};
  const colorGroupMap = new Map<string, ColorGroup>();
  const deckGroupTotals: Record<string, number> = {};

  playableDeck.forEach(c => {
    cardFrequency[c.id] = 0;
    const g = getCardColorGroup(c.backgroundColor);
    colorGroupMap.set(c.id, g);
    deckGroupTotals[g] = (deckGroupTotals[g] || 0) + 1;
  });

  const hasColorVariety = Object.keys(deckGroupTotals).length > 1;
  const shouldBalanceColors = config.balanceColors !== false && hasColorVariety;

  // Dynamic per-board color quotas (e.g. for 16 cells: softCap = 4, hardCap = 5)
  const softColorCap = Math.max(1, Math.floor(cellsPerBoard / 4));
  const hardColorCap = Math.max(2, Math.ceil(cellsPerBoard / 3.2));

  let attempts = 0;
  const maxAttempts = config.quantity * 200;

  while (generatedBoards.length < config.quantity && attempts < maxAttempts) {
    attempts++;
    let boardCards: LoteriaCard[] = [];

    if (!config.allowDuplicates) {
      if (shouldBalanceColors) {
        // Pick `cellsPerBoard` distinct cards balancing both global card frequency and per-board color variety
        const cardNoise: Record<string, number> = {};
        for (let i = 0; i < totalCards; i++) {
          cardNoise[playableDeck[i].id] = Math.random() * 2;
        }

        const selectedSubset: LoteriaCard[] = [];
        const selectedIds = new Set<string>();
        const groupCountsOnBoard: Record<string, number> = {};

        for (let slot = 0; slot < cellsPerBoard; slot++) {
          let bestCard: LoteriaCard | null = null;
          let bestScore = Infinity;

          for (let i = 0; i < totalCards; i++) {
            const candidate = playableDeck[i];
            if (selectedIds.has(candidate.id)) continue;

            const g = colorGroupMap.get(candidate.id) || 'neutral';
            const currentGroupCount = groupCountsOnBoard[g] || 0;
            if (currentGroupCount >= hardColorCap) continue;

            // Progressive color saturation penalty to favor variety across color families
            const colorPenalty =
              currentGroupCount * 0.35 + (currentGroupCount >= softColorCap ? 2.5 : 0);
            const score = cardFrequency[candidate.id] + cardNoise[candidate.id] + colorPenalty;

            if (score < bestScore) {
              bestScore = score;
              bestCard = candidate;
            }
          }

          // Fallback if hardColorCap blocked all remaining cards (e.g. heavily skewed custom deck)
          if (!bestCard) {
            for (let i = 0; i < totalCards; i++) {
              const candidate = playableDeck[i];
              if (!selectedIds.has(candidate.id)) {
                bestCard = candidate;
                break;
              }
            }
          }

          if (bestCard) {
            selectedSubset.push(bestCard);
            selectedIds.add(bestCard.id);
            const g = colorGroupMap.get(bestCard.id) || 'neutral';
            groupCountsOnBoard[g] = (groupCountsOnBoard[g] || 0) + 1;
          }
        }

        boardCards = arrangeCardsWithColorDispersion(
          selectedSubset,
          config.rows,
          config.cols,
          colorGroupMap
        );
      } else {
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
      }
    } else {
      // Duplicates allowed inside the board
      for (let i = 0; i < cellsPerBoard; i++) {
        const randomCard = playableDeck[Math.floor(Math.random() * totalCards)];
        boardCards.push(randomCard);
      }
      if (shouldBalanceColors) {
        boardCards = arrangeCardsWithColorDispersion(
          boardCards,
          config.rows,
          config.cols,
          colorGroupMap
        );
      }
    }

    // Generate a unique fingerprint for this board
    const signature = boardCards.map(c => c.id).join('-');
    const combinationKey = [...boardCards].map(c => c.id).sort().join('-');

    // When totalCards > cellsPerBoard, ensure each board also has a distinct combination of cards
    const isDuplicateBoard =
      existingSignatures.has(signature) ||
      (!config.allowDuplicates &&
        totalCards > cellsPerBoard &&
        existingCombinations.has(combinationKey));

    if (!isDuplicateBoard) {
      existingSignatures.add(signature);
      existingCombinations.add(combinationKey);

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
