/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Ninho é sempre dark — desativa media query automática do NativeWind.
  // Sem 'class', a lib tenta setar o color scheme via media e lança o aviso.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Design tokens Ninho (handoff) ──────────────────────────
        // Backgrounds
        page:    '#0d1b2a', // bg-page  — fundo de toda tela
        card:    '#16283d', // bg-card  — cards e blocos internos
        nav:     '#0a1420', // bg-nav   — fundo da tab bar inferior
        border:  '#2a3d52', // border   — bordas sutis / divisores
        // Accent
        'accent-primary':   '#e8720c', // CTA principal
        'accent-secondary': '#f0b429', // ícones de destaque
        'accent-tertiary':  '#f5d9b0', // superfícies claras
        // Texto
        'text-base':     '#fdf6ec', // texto principal
        'text-muted':    '#f5d9b0', // texto secundário/legendas
        'text-on-light': '#4a1b0c', // texto sobre accent backgrounds
        // Status
        error:   '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
        // Aliases curtos usados nas classes
        ninho: {
          bg:        '#0d1b2a',
          card:      '#16283d',
          nav:       '#0a1420',
          border:    '#2a3d52',
          primary:   '#e8720c',
          secondary: '#f0b429',
          tertiary:  '#f5d9b0',
          text:      '#fdf6ec',
          muted:     '#f5d9b0',
          'on-light':'#4a1b0c',
        },
      },
      borderRadius: {
        sm:    '8px',
        md:    '12px',
        lg:    '16px',
        xl:    '20px',
        '2xl': '28px',
        full:  '9999px',
      },
      spacing: {
        xs:    '4px',
        sm:    '8px',
        md:    '12px',
        lg:    '16px',
        xl:    '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '16px' }],
        sm:   ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md:   ['14px', { lineHeight: '20px' }],
        lg:   ['15px', { lineHeight: '22px' }],
        xl:   ['16px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
};
