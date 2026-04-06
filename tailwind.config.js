/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg:           'var(--color-bg)',
        card:         'var(--color-card)',
        'card-alt':   'var(--color-card-alt)',
        'card-deep':  'var(--color-card-deep)',
        // Dark surfaces
        dark:         'var(--color-dark)',
        'dark-2':     'var(--color-dark-2)',
        'dark-3':     'var(--color-dark-3)',
        // Text
        text:         'var(--color-text)',
        secondary:    'var(--color-text-secondary)',
        tertiary:     'var(--color-text-tertiary)',
        // Surfaces & borders
        surface:            'var(--color-surface)',
        'surface-alt':      'var(--color-surface-alt)',
        border:             'var(--color-border)',
        'border-highlight': 'var(--color-border-highlight)',
        // Inputs
        'input-bg':         'var(--color-input-bg)',
        'input-border':     'var(--color-input-border)',
        // Accent – lime (primary brand)
        'budgy-lime':         'var(--color-lime)',
        'budgy-lime-light':   'var(--color-lime-light)',
        'budgy-lime-dark':    'var(--color-lime-dark)',
        // Accent – semantic (prefixed to avoid overriding Tailwind's built-in palettes)
        'budgy-green':        'var(--color-green)',
        'budgy-red':          'var(--color-red)',
        'budgy-blue':         'var(--color-blue)',
        'budgy-purple':       'var(--color-purple)',
        'budgy-orange':       'var(--color-orange)',
        'budgy-pink':         'var(--color-pink)',
      },
    },
  },
  plugins: [],
}