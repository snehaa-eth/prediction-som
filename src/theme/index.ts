// ── Luxury Gamified Theme ────────────────────────────────────────
// Deep blacks, champagne gold accents, emerald greens, ruby reds
// Inspired by high-end casino/luxury brand aesthetics with gamification

const shared = {
  // Primary accent — warm rose gold (true jewelry gold, not yellow)
  accent: '#C4956A',
  accentLight: '#D4A87E',
  accentGlow: 'rgba(196,149,106,0.30)',
  accentDim: 'rgba(196,149,106,0.12)',

  // Secondary — muted mauve
  purple: '#9B8AAF',
  purpleGlow: 'rgba(155,138,175,0.25)',

  // Outcomes
  profit: '#50E3A4', // emerald mint
  loss: '#E8556D',   // muted ruby

  // XP / Gamification
  xp: '#C4956A',
  xpGlow: 'rgba(196,149,106,0.35)',
  streak: '#D4A06A', // warm amber
  badge: '#50E3A4',
};

export const lightTheme = {
  ...shared,
  mode: 'light' as const,

  primaryBg: '#FAFAF8',
  secondaryBg: '#F2F0EC',
  cardBg: '#FFFFFF',
  border: '#E8E4DC',

  textPrimary: '#1A1714',
  textSecondary: '#8A8478',

  yes: '#D4AF37',
  no: '#1A1714',
  yesBg: 'rgba(212,175,55,0.10)',
  noBg: 'rgba(0,0,0,0.04)',
  yesGlow: 'rgba(212,175,55,0.35)',
  noGlow: 'rgba(0,0,0,0.06)',

  inactive: '#B8B0A4',

  glass: 'rgba(0,0,0,0.03)',
  glassBorder: 'rgba(0,0,0,0.06)',

  cardGradientEnd: 'rgba(250,250,248,0.97)',
  cardGradientMid: 'rgba(250,250,248,0.6)',

  navBg: '#FAFAF8',
  navBorder: '#E8E4DC',

  noBtnBg: '#FFFFFF',
  noBtnBorder: '#D1CBC0',
  noBtnIcon: '#1A1714',
  yesBtnBg: '#D4AF37',
  yesBtnIcon: '#FFFFFF',

  shadow: '#000000',
};

export const darkTheme = {
  ...shared,
  mode: 'dark' as const,

  primaryBg: '#0A0A0A',
  secondaryBg: '#141414',
  cardBg: '#1A1A1A',
  border: '#2A2A2A',

  textPrimary: '#F5F0E8',
  textSecondary: '#8A8478',

  yes: '#D4AF37',
  no: '#F5F0E8',
  yesBg: 'rgba(212,175,55,0.15)',
  noBg: 'rgba(245,240,232,0.06)',
  yesGlow: 'rgba(212,175,55,0.4)',
  noGlow: 'rgba(245,240,232,0.08)',

  inactive: '#4A4A4A',

  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',

  cardGradientEnd: 'rgba(10,10,10,0.97)',
  cardGradientMid: 'rgba(10,10,10,0.6)',

  navBg: '#0A0A0A',
  navBorder: '#1E1E1E',

  noBtnBg: '#1A1A1A',
  noBtnBorder: '#8A8478',
  noBtnIcon: '#F5F0E8',
  yesBtnBg: '#D4AF37',
  yesBtnIcon: '#0A0A0A',

  shadow: '#D4AF37',
};

export type AppTheme = typeof lightTheme | typeof darkTheme;

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
