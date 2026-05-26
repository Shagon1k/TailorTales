import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Mantine requires actual hex values (not CSS vars) to compute interactive states.
// index 6 = --color-fox (primary). Keep in sync with tokens.css if primitives change.
const fox: MantineColorsTuple = [
    '#fff0eb',
    '#ffdcd0',
    '#ffc4af',
    '#ffa98c',
    '#f98e6a',
    '#f87550',
    '#f86e42',
    '#e05a2f',
    '#c4471e',
    '#a3360f',
];

export const theme = createTheme({
    primaryColor: 'fox',
    colors: { fox },

    fontFamily: 'var(--font-sans)',
    fontFamilyMonospace: 'var(--font-mono)',
    headings: {
        fontFamily: 'var(--font-serif)',
    },

    defaultRadius: 'md',
    radius: {
        xs: 'var(--radius-sm)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
    },

    spacing: {
        xs: 'var(--space-1)',
        sm: 'var(--space-2)',
        md: 'var(--space-4)',
        lg: 'var(--space-6)',
        xl: 'var(--space-8)',
    },

    shadows: {
        xs: 'var(--shadow-sm)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-glow-fox)',
    },
});
