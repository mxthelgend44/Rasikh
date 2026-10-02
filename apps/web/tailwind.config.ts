import type { Config } from 'tailwindcss';

const channel = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: channel('canvas'),
        surface: channel('surface'),
        raised: channel('raised'),
        subtle: channel('subtle'),
        hover: channel('hover'),
        selected: channel('selected'),
        track: channel('track'),
        line: channel('line'),
        'line-strong': channel('line-strong'),
        edge: channel('edge'),
        fg: channel('fg'),
        'fg-secondary': channel('fg-secondary'),
        'fg-tertiary': channel('fg-tertiary'),
        'fg-placeholder': channel('fg-placeholder'),
        solid: channel('solid'),
        'solid-fg': channel('solid-fg'),
        accent: channel('accent'),
        'accent-soft': channel('accent-soft'),
        'accent-fg': channel('accent-fg'),
        success: channel('success'),
        'success-soft': channel('success-soft'),
        'success-solid': channel('success-solid'),
        warning: channel('warning'),
        'warning-soft': channel('warning-soft'),
        danger: channel('danger'),
        'danger-soft': channel('danger-soft'),
        'danger-solid': channel('danger-solid'),
        focus: channel('focus'),
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        caption: ['0.75rem', '1rem'],
        label: ['0.8125rem', '1.125rem'],
        body: ['0.875rem', '1.25rem'],
        title: ['1rem', '1.5rem'],
        heading: ['1.25rem', '1.75rem'],
        display: ['1.5rem', '2rem'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
        dialog: 'var(--shadow-dialog)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-rail': 'var(--sidebar-rail-width)',
      },
      height: {
        topbar: 'var(--topbar-height)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'pop-in': 'pop-in 150ms ease-out',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
