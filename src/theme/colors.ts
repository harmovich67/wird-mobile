export const Colors = {
  // Deep Royal Emerald & Forest Green
  emeraldDark: '#041d15',
  emeraldDeep: '#06291e',
  emeraldBase: '#0d3d2e',
  emeraldCard: '#104938',
  emeraldLight: '#19654d',
  emeraldAccent: '#10b981',

  // Metallic & Radiant Golds
  goldShine: '#fae7a5',
  goldBright: '#f5d47a',
  goldBase: '#e2ba59',
  goldDeep: '#ba8e30',
  goldDark: '#8c6818',

  // Backgrounds & Surface
  bgDark: '#051b14',
  bgCard: 'rgba(16, 73, 56, 0.65)',
  bgCardSolid: '#0e382b',
  bgInput: 'rgba(5, 27, 20, 0.7)',
  bgOverlay: 'rgba(4, 29, 21, 0.85)',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textGold: '#f5d47a',
  textEmerald: '#34d399',

  // Borders & Accents
  borderGold: 'rgba(226, 186, 89, 0.35)',
  borderEmerald: 'rgba(16, 185, 129, 0.25)',
  borderLight: 'rgba(255, 255, 255, 0.1)',

  // Status & Tajweed Palette
  tajweedRed: '#ef4444',
  tajweedGreen: '#10b981',
  tajweedBlue: '#0ea5e9',
  tajweedOrange: '#f59e0b',
  tajweedPurple: '#a855f7',
  tajweedGray: '#64748b',

  // Functional
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#38bdf8',
};

export const Gradients = {
  royalBackground: ['#041d15', '#06291e', '#0d3d2e'] as const,
  cardGold: ['#104938', '#0c3a2c'] as const,
  goldButton: ['#f5d47a', '#e2ba59', '#ba8e30'] as const,
  emeraldButton: ['#10b981', '#059669', '#047857'] as const,
  goldBorder: ['#fae7a5', '#ba8e30', '#fae7a5'] as const,
  headerGlow: ['rgba(226, 186, 89, 0.15)', 'transparent'] as const,
};
