export type AppThemeMode = 'light' | 'dark';

type Palette = {
  background: string;
  surface: string;
  card: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentSoft: string;
  glass: string;
  glassStrong: string;
  glassBorder: string;
  shadow: string;
};

export const themes: Record<AppThemeMode, Palette> = {
  light: {
    background: '#060E20',
    surface: '#0F1930',
    card: '#141F38',
    border: 'rgba(64, 72, 93, 0.35)',
    textPrimary: '#DEE5FF',
    textMuted: '#A3AAC4',
    accent: '#BA9EFF',
    accentSecondary: '#8455EF',
    accentSoft: '#192540',
    glass: 'rgba(31, 43, 73, 0.55)',
    glassStrong: 'rgba(31, 43, 73, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    shadow: 'rgba(8, 12, 24, 0.65)',
  },
  dark: {
    background: '#0F1020',
    surface: '#17192D',
    card: '#1D1F34',
    border: '#2C2F4F',
    textPrimary: '#F2F4FF',
    textMuted: '#B4B9D6',
    accent: '#8E2DE2',
    accentSecondary: '#4A00E0',
    accentSoft: '#271E43',
    glass: 'rgba(30, 32, 54, 0.62)',
    glassStrong: 'rgba(30, 32, 54, 0.78)',
    glassBorder: 'rgba(255, 255, 255, 0.18)',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
};

export const palette = themes.light;
