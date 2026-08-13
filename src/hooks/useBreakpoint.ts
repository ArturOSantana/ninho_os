// src/hooks/useBreakpoint.ts
// Detecta se estamos em desktop (web ≥ 768px) ou mobile
import { useWindowDimensions, Platform } from 'react-native';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const isMobile = !isDesktop;
  return { isDesktop, isMobile, isWeb, width };
}
