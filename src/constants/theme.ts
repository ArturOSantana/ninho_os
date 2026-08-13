// src/constants/theme.ts
// Design tokens canônicos do Ninho — espelham exatamente o handoff de design.
// Nunca usar hex diretamente nos componentes novos; sempre referenciar estes tokens.

export const Colors = {
  // ── Fundos ──────────────────────────────────────────────────
  bgPage:  '#0d1b2a', // fundo de toda tela
  bgCard:  '#16283d', // cards e blocos internos
  bgNav:   '#0a1420', // fundo da barra de navegação inferior

  // ── Bordas ──────────────────────────────────────────────────
  border:  '#2a3d52', // bordas sutis, divisores, tracejados

  // ── Accent ──────────────────────────────────────────────────
  primary:   '#e8720c', // CTA principal, ações primárias
  secondary: '#f0b429', // ícones de destaque, indicadores secundários
  tertiary:  '#f5d9b0', // superfícies claras (avatar bg), texto secundário

  // ── Texto ───────────────────────────────────────────────────
  textPrimary:   '#fdf6ec', // texto principal sobre fundo escuro
  textSecondary: '#f5d9b0', // texto secundário / legendas
  textOnLight:   '#4a1b0c', // texto sobre accent-primary / secondary / tertiary

  // ── Status (apenas para erros técnicos reais) ───────────────
  error:   '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  info:    '#007AFF',

  // ── Aliases de compatibilidade — não usar em código novo ────
  page:        '#0d1b2a',
  card:        '#16283d',
  textBase:    '#fdf6ec',
  textMuted:   '#f5d9b0',
  onLight:     '#4a1b0c',
  bg:          '#0d1b2a',
  surface:     '#16283d',
  text:        '#fdf6ec',
  muted:       '#f5d9b0',
  orange:      '#e8720c',
  orangeLight: '#f0b429',
  orangeBg:    '#1a2c1a',
  amber:       '#f0b429',
  amberBg:     '#1e2b10',
  cream:       '#f5d9b0',
  creamBg:     '#1e2318',
  sand:        '#c8b89a',
} as const;

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  xxl:   24,
  xxxl:  32,
} as const;

export const Radius = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 28,
  xxl:   28,
  full:  9999,
} as const;

export const FontSize = {
  xs:      11,
  sm:      12,
  base:    13,
  md:      14,
  lg:      15,
  xl:      16,
  xxl:     20,
  xxxl:    24,
  display: 30,
} as const;

// Cor da barra lateral do EventCard por categoria
export const EVENT_CATEGORY_COLOR: Record<string, string> = {
  appointment: '#e8720c',
  vaccine:     '#f0b429',
  school:      '#f5d9b0',
  personal:    '#2a3d52',
  other:       '#2a3d52',
};
