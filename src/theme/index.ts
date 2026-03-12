// Shared accent colors
const shared = {
  accent: '#FF45A8',
  accentLight: '#FF6FBF',
  accentGlow: 'rgba(255,69,168,0.30)',
  accentDim: 'rgba(255,69,168,0.12)',

  purple: '#8B5CF6',
  purpleGlow: 'rgba(139,92,246,0.25)',

  profit: '#34D399',
  loss: '#F87171',
};

export const lightTheme = {
  ...shared,
  mode: 'light' as const,

  primaryBg: '#FFFFFF',
  secondaryBg: '#F5F5F7',
  cardBg: '#FFFFFF',
  border: '#E5E5EA',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',

  yes: '#FF45A8',
  no: '#1A1A1A',
  yesBg: 'rgba(255,69,168,0.10)',
  noBg: 'rgba(0,0,0,0.05)',
  yesGlow: 'rgba(255,69,168,0.35)',
  noGlow: 'rgba(0,0,0,0.08)',

  inactive: '#9CA3AF',

  glass: 'rgba(0,0,0,0.04)',
  glassBorder: 'rgba(0,0,0,0.08)',

  // Card overlay for text readability on card gradient
  cardGradientEnd: 'rgba(255,255,255,0.97)',
  cardGradientMid: 'rgba(255,255,255,0.6)',

  // Navigation bar
  navBg: '#FFFFFF',
  navBorder: '#E5E5EA',

  // Action buttons
  noBtnBg: '#FFFFFF',
  noBtnBorder: '#D1D5DB',
  noBtnIcon: '#1A1A1A',
  yesBtnBg: '#FF45A8',
  yesBtnIcon: '#FFFFFF',

  shadow: '#000000',
};

export const darkTheme = {
  ...shared,
  mode: 'dark' as const,

  primaryBg: '#0D0011',
  secondaryBg: '#170820',
  cardBg: '#1E0C2E',
  border: '#2E1940',

  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',

  yes: '#FF45A8',
  no: '#FFFFFF',
  yesBg: 'rgba(255,69,168,0.15)',
  noBg: 'rgba(255,255,255,0.08)',
  yesGlow: 'rgba(255,69,168,0.4)',
  noGlow: 'rgba(255,255,255,0.12)',

  inactive: '#555566',

  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.10)',

  cardGradientEnd: 'rgba(13,0,17,0.97)',
  cardGradientMid: 'rgba(13,0,17,0.6)',

  navBg: '#0D0011',
  navBorder: '#2E1940',

  noBtnBg: '#1E0C2E',
  noBtnBorder: '#9CA3AF',
  noBtnIcon: '#FFFFFF',
  yesBtnBg: '#FF45A8',
  yesBtnIcon: '#FFFFFF',

  shadow: '#FF45A8',
};

export type AppTheme = typeof lightTheme;

// Keep these for non-theme-context usage
export const colors = lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  card: 18,
  button: 14,
  lg: 20,
  bottomSheet: 28,
};

export const typography = {
  marketQuestion: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  probability: { fontSize: 28, fontWeight: '700' as const },
  cardLabel: { fontSize: 13, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  heading: { fontSize: 22, fontWeight: '600' as const },
  large: { fontSize: 26, fontWeight: '700' as const },
  tag: { fontSize: 11, fontWeight: '500' as const },
};
