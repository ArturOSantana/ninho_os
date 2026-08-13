// src/constants/theme.ts
// Design tokens v3 — paleta clean/moderna
// Referências: Linear, Notion, Superhuman
// Nunca usar hex diretamente nos componentes; sempre referenciar estes tokens.

export const Colors = {
  // ── Fundos ──────────────────────────────────────────────────
  bgPage:  '#0f1117', // fundo de toda tela — quase preto neutro
  bgCard:  '#1a1d27', // cards — cinza-azulado escuro
  bgNav:   '#0f1117', // fundo da barra de navegação inferior

  // ── Superfícies de elevação ──────────────────────────────────
  surfaceHover:  '#1f2333',
  surfaceActive: '#252a3d',

  // ── Bordas ──────────────────────────────────────────────────
  border:     '#252a3d',
  borderMid:  '#2e3347',
  borderHigh: '#3d4460',

  // ── Accent ──────────────────────────────────────────────────
  primary:   '#5b7cf6', // indigo suave — CTA principal
  primaryBg: '#1a1f3c',

  secondary: '#38bdf8',
  success:   '#22c55e',
  successBg: '#0f2918',

  amber:    '#f59e0b',
  amberBg:  '#271f0a',

  coral:    '#f97316',
  coralBg:  '#251509',

  // ── Texto ───────────────────────────────────────────────────
  textPrimary:   '#f1f3f9',
  textSecondary: '#8892a4',
  textDisabled:  '#4a5168',
  textOnPrimary: '#ffffff',

  // ── Status ──────────────────────────────────────────────────
  error:   '#f87171',
  errorBg: '#2a1010',
  warning: '#fbbf24',
  info:    '#60a5fa',

  // ── Aliases legacy — compatibilidade com código existente ───
  bg:          '#0f1117',
  card:        '#1a1d27',
  surface:     '#1a1d27',
  text:        '#f1f3f9',
  muted:       '#8892a4',
  onLight:     '#ffffff',
  orange:      '#f97316',
  orangeLight: '#f59e0b',
  orangeBg:    '#251509',
  cream:       '#8892a4',
  creamBg:     '#1a1d27',
  sand:        '#8892a4',
  textBase:    '#f1f3f9',
  textMuted:   '#8892a4',
  textOnLight: '#ffffff',
  tertiary:    '#8892a4',
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
  sm:    6,
  md:    10,
  lg:    14,
  xl:    18,
  '2xl': 24,
  xxl:   24,
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

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};

// Cor da barra lateral do EventCard por categoria
export const EVENT_CATEGORY_COLOR: Record<string, string> = {
  appointment: '#5b7cf6',
  vaccine:     '#f59e0b',
  school:      '#38bdf8',
  personal:    '#22c55e',
  other:       '#252a3d',
};

// Largura máxima para conteúdo central no web
export const WEB_MAX_WIDTH = 960;
export const WEB_SIDEBAR_WIDTH = 220;
