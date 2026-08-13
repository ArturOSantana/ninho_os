// src/components/ui/FoxMark.tsx
// Marca da raposa do Ninho — SVG estilizado, cores fixas por spec do handoff.
// Usar no topo de telas de auth, onboarding e splash.

import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface FoxMarkProps {
  /** Largura do componente. Altura é calculada automaticamente (ratio 1:1). */
  size?: number;
}

/**
 * Logotipo/marca da raposa do Ninho.
 * As cores são fixas por spec — não usar tokens do tema aqui.
 *
 * Uso:
 * ```tsx
 * <FoxMark size={48} />
 * ```
 */
export function FoxMark({ size = 40 }: FoxMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Marca Ninho"
      accessibilityRole="image"
    >
      {/* Corpo principal — laranja primário */}
      <Path
        d="M50 10 L20 35 L15 70 Q50 95 85 70 L80 35 Z"
        fill="#e8720c"
      />
      {/* Orelhas */}
      <Path
        d="M20 35 L10 10 L35 28 Z"
        fill="#e8720c"
      />
      <Path
        d="M80 35 L90 10 L65 28 Z"
        fill="#e8720c"
      />
      {/* Orelhas internas */}
      <Path
        d="M22 32 L15 14 L33 28 Z"
        fill="#f0b429"
      />
      <Path
        d="M78 32 L85 14 L67 28 Z"
        fill="#f0b429"
      />
      {/* Focinho / máscara clara */}
      <Path
        d="M35 55 Q50 75 65 55 Q55 48 50 50 Q45 48 35 55 Z"
        fill="#f5d9b0"
      />
      {/* Olhos */}
      <Circle cx="37" cy="45" r="4" fill="#4a1b0c" />
      <Circle cx="63" cy="45" r="4" fill="#4a1b0c" />
      {/* Brilho dos olhos */}
      <Circle cx="38.5" cy="43.5" r="1.2" fill="#fdf6ec" />
      <Circle cx="64.5" cy="43.5" r="1.2" fill="#fdf6ec" />
    </Svg>
  );
}
