import React from 'react';
import { Pipette, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRecentColors, triggerEyeDropper } from '../utils/recentColors';

interface ColorPickerExtrasProps {
  currentColor: string;
  onChangeColor: (hex: string) => void;
  onActivateEyedropper?: () => void;
  isEyedropperActive?: boolean;
  className?: string;
  pickerSize?: 'sm' | 'md';
}

const isLightColor = (hex?: string): boolean => {
  if (!hex || typeof hex !== 'string') return false;
  const h = hex.trim().toUpperCase();
  return (
    h === '#FFFFFF' ||
    h === '#FEF3C7' ||
    h === '#FEF9E7' ||
    h === '#FDFBF7' ||
    h === '#DCFCE7' ||
    h === '#E0F2FE' ||
    h === '#FEF08A' ||
    h === '#D6D3D1'
  );
};

export const ColorPickerExtras: React.FC<ColorPickerExtrasProps> = ({
  currentColor,
  onChangeColor,
  onActivateEyedropper,
  isEyedropperActive = false,
  className = '',
  pickerSize = 'md',
}) => {
  const { t, language } = useLanguage();
  const { recentColors, addColor } = useRecentColors();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    onChangeColor(val);
    addColor(val);
  };

  const handleEyedropperClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await triggerEyeDropper(
      (pickedHex) => {
        onChangeColor(pickedHex);
        addColor(pickedHex);
      },
      () => {
        if (onActivateEyedropper) {
          onActivateEyedropper();
        }
      }
    );
  };

  const isSm = pickerSize === 'sm';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Top line: Native color picker + Eyedropper button + current HEX badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Native Color Picker */}
        <div className="relative flex items-center">
          <input
            type="color"
            value={currentColor && currentColor.startsWith('#') ? currentColor : '#141413'}
            onChange={handleInputChange}
            className={`${
              isSm ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0 bg-transparent transition-transform hover:scale-105`}
            title={t('custom_color')}
          />
        </div>

        {/* Eyedropper Button */}
        <button
          type="button"
          onClick={handleEyedropperClick}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
            isEyedropperActive
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 shadow-2xs'
              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
          }`}
          title={
            isEyedropperActive
              ? t('eyedropper_active_tooltip')
              : language === 'en'
              ? 'Sample color from screen or preview image'
              : 'Absorber color de la pantalla o de la vista previa'
          }
        >
          <Pipette className={`w-3 h-3 ${isEyedropperActive ? 'animate-bounce text-white' : 'text-stone-600'}`} />
          <span>{t('eyedropper_tool_label')}</span>
        </button>

        {/* Hex label */}
        <span className="text-[10px] font-mono text-stone-500 select-all font-semibold">
          {currentColor}
        </span>
      </div>

      {/* Bottom line: Recent Colors Row */}
      {recentColors.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
            {t('recent_colors_label')}
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {recentColors.map((hex) => {
              const isSelected = currentColor.toLowerCase() === hex.toLowerCase();
              const light = isLightColor(hex);
              return (
                <button
                  key={`recent-${hex}`}
                  type="button"
                  onClick={() => {
                    onChangeColor(hex);
                    addColor(hex);
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center cursor-pointer shadow-3xs ${
                    isSelected
                      ? 'scale-115 border-stone-900 ring-1 ring-stone-900 shadow-2xs'
                      : 'border-stone-300/90 hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`${hex} (${language === 'en' ? 'Click to reuse' : 'Clic para reusar'})`}
                >
                  {isSelected && (
                    <Check
                      className={`w-2.5 h-2.5 ${
                        light ? 'text-stone-950 font-black' : 'text-white'
                      } drop-shadow-xs`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
