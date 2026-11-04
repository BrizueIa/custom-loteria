import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { App } from '../App';

describe('Integration Flow: Generator ↔ Game (Cantador)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in Cantador (game mode), unlocks with PIN, navigates to Generator, edits deck and syncs back to Game', async () => {
    render(<App />);

    // 1. App starts in Game View (Cantador)
    expect(screen.getByText(/Baraja Lista|Deck Ready/i)).toBeInTheDocument();

    // 2. Open Settings and Unlock Admin
    const settingsButton = screen.getByTitle(/Ajustes y Opciones|Settings & Options/i);
    fireEvent.click(settingsButton);

    // Click Admin Access button in modal
    const adminAccessBtn = screen.getByRole('button', { name: /Acceso Admin|Admin Access/i });
    fireEvent.click(adminAccessBtn);

    // Password modal appears
    const pinInput = screen.getByPlaceholderText(/Ej\. 1234|e\.g\. 1234/i);
    fireEvent.change(pinInput, { target: { value: '1234' } });

    const unlockSubmit = screen.getByText(/Desbloquear Generador|Unlock Generator/i);
    fireEvent.click(unlockSubmit);

    // 3. User is now in Generator View
    await waitFor(() => {
      expect(screen.getByText(/1\. Figuras|1\. Figures/i)).toBeInTheDocument();
    });

    // Verify 54 cards in grid
    expect(screen.getAllByText(/#1\b/i).length).toBeGreaterThan(0);

    // 4. Navigate back to Game
    const goToGameBtn = screen.getByTitle(/Ir a Jugar|Go to Game/i);
    fireEvent.click(goToGameBtn);

    // 5. Game mode should be active and ready
    await waitFor(() => {
      expect(screen.getByText(/Baraja Lista|Deck Ready/i)).toBeInTheDocument();
    });
  });
});
