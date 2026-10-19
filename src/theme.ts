export const colors = {
  bg: '#070614',
  bgElevated: '#0D0B22',
  surface: '#121031',
  surfaceHigh: '#1A1742',
  border: 'rgba(150, 130, 255, 0.14)',
  borderStrong: 'rgba(170, 140, 255, 0.32)',
  text: '#F3F1FF',
  textSecondary: '#B7B2DA',
  textMuted: '#7D78A8',
  violet: '#A855F7',
  magenta: '#E449F5',
  blue: '#4F6BFF',
  cyan: '#22D3EE',
  danger: '#FF5C7A',
  success: '#34D399',
  overlay: 'rgba(4, 3, 14, 0.72)',
};

/** Gradient marki (z logo): różowy fiolet → indygo → błękit. */
export const brandGradient = ['#E449F5', '#7C4DFF', '#3B82F6'] as const;
export const brandGradientSoft = ['rgba(228,73,245,0.22)', 'rgba(79,107,255,0.10)'] as const;

/** Kolory myśli — dobrane do ciemnego motywu, czytelne jako akcent. */
export const thoughtColors = [
  '#A855F7',
  '#E449F5',
  '#F472B6',
  '#4F6BFF',
  '#22D3EE',
  '#34D399',
  '#FACC15',
  '#FB923C',
  '#F87171',
  '#94A3B8',
];

export const defaultThoughtColor = '#A855F7';

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const APP_NAME = 'Fusionote';
export const TAGLINE = 'Twoje myśli. Zawsze przy Tobie.';
