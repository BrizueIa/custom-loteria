import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPickerExtras } from '../ColorPickerExtras';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { saveRecentColor, clearStoredRecentColors } from '../../utils/recentColors';

const renderWithLang = (ui: React.ReactElement) => {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

describe('ColorPickerExtras component', () => {
  it('renders native color picker input and displays current hex', () => {
    clearStoredRecentColors();
    const handleChange = vi.fn();
    renderWithLang(
      <ColorPickerExtras
        currentColor="#FF0000"
        onChangeColor={handleChange}
      />
    );

    expect(screen.getByText('#FF0000')).toBeDefined();
    expect(screen.getByRole('button', { name: /Gotero/i })).toBeDefined();
  });

  it('renders stored recent colors and allows 1-click selection', () => {
    clearStoredRecentColors();
    saveRecentColor('#123456');
    saveRecentColor('#789ABC');

    const handleChange = vi.fn();
    renderWithLang(
      <ColorPickerExtras
        currentColor="#000000"
        onChangeColor={handleChange}
      />
    );

    expect(screen.getByText(/Recientes:/i)).toBeDefined();

    // Click the recent color swatch for #123456
    const swatch = screen.getByTitle(/#123456/i);
    expect(swatch).toBeDefined();
    fireEvent.click(swatch);

    expect(handleChange).toHaveBeenCalledWith('#123456');
  });

  it('triggers eyedropper callback when clicking Pipette button', () => {
    const handleEyedropper = vi.fn();
    renderWithLang(
      <ColorPickerExtras
        currentColor="#141413"
        onChangeColor={vi.fn()}
        onActivateEyedropper={handleEyedropper}
      />
    );

    const button = screen.getByRole('button', { name: /Gotero/i });
    fireEvent.click(button);

    expect(handleEyedropper).toHaveBeenCalled();
  });
});
