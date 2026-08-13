/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds
        'bg-page': '#0f1117',
        'bg-card': '#1a1d27',
        'bg-nav':  '#0f1117',

        // ── Surfaces
        'surface-hover':   '#1f2333',
        'surface-active':  '#252a3d',

        // ── Borders
        border:       '#252a3d',
        'border-mid': '#2e3347',

        // ── Accent
        primary:     '#5b7cf6',
        'primary-bg':'#1a1f3c',
        secondary:   '#38bdf8',
        success:     '#22c55e',
        'success-bg':'#0f2918',
        amber:       '#f59e0b',
        'amber-bg':  '#271f0a',
        coral:       '#f97316',
        'coral-bg':  '#251509',

        // ── Text
        'text-base':     '#f1f3f9',
        'text-muted':    '#8892a4',
        'text-disabled': '#4a5168',

        // ── Status
        error:      '#f87171',
        'error-bg': '#2a1010',
        warning:    '#fbbf24',
        info:       '#60a5fa',

        // ── Aliases curtos
        ninho: {
          bg:      '#0f1117',
          card:    '#1a1d27',
          border:  '#252a3d',
          primary: '#5b7cf6',
          muted:   '#8892a4',
          text:    '#f1f3f9',
        },
      },
      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '14px',
        xl:    '18px',
        '2xl': '24px',
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
