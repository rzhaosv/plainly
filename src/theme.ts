import { Platform, TextStyle } from 'react-native';

/** Warm cream page, deep plum ink, lilac + coral accents (the two speech shapes in the icon). */
export const colors = {
  bg: '#F7F3EE',
  surface: '#FFFCF8',
  surface2: '#EFE8E0',
  ink: '#2A2233',
  text: '#2A2233',
  soft: '#554B60',
  muted: '#847A8E',
  accent: '#6B4FA0',
  accentSoft: '#E9E1F5',
  coral: '#E0765A',
  coralSoft: '#FBE4DC',
  lilac: '#C4B0E8',
  plum: '#3A2854',
  plumDeep: '#241838',
  onPlum: '#F7F3EE',
  onPlumMuted: '#B9AECB',
  line: 'rgba(42,34,51,0.10)',
  lineStrong: 'rgba(42,34,51,0.22)',
  onAccent: '#FFFFFF',
  danger: '#B33A3A',
  ok: '#2F7D63',
  okSoft: '#DDEFE7',
  overlay: 'rgba(42,34,51,0.45)',
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const space = (n: number) => n * 4;

export const serif = Platform.select({
  ios: 'Georgia',
  web: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  default: 'serif',
}) as string;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type: Record<string, TextStyle> = {
  display: { fontSize: 32, fontWeight: '700', color: colors.ink, letterSpacing: -0.4, fontFamily: serif },
  h1: { fontSize: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.3, fontFamily: serif },
  h2: { fontSize: 21, fontWeight: '700', color: colors.ink, letterSpacing: -0.2, fontFamily: serif },
  h3: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, fontWeight: '400', color: colors.ink, lineHeight: 24 },
  bodySoft: { fontSize: 15, fontWeight: '400', color: colors.soft, lineHeight: 22 },
  quote: { fontSize: 20, fontWeight: '400', color: colors.ink, lineHeight: 30, fontFamily: serif, fontStyle: 'italic' },
  eyebrow: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: 1.6, textTransform: 'uppercase' },
  label: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: 1.4, textTransform: 'uppercase' },
  sub: { fontSize: 13, fontWeight: '500', color: colors.soft },
  caption: { fontSize: 12, fontWeight: '500', color: colors.muted },
  num: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, ...tabular },
};
