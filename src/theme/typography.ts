// Typography tokens
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const Typography = {
  fontFamily,

  // Font sizes
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  h4: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },

  bodyLarge: { fontSize: 17, lineHeight: 26, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },

  labelLarge: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const },

  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  overline: { fontSize: 10, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },

  // Button text sizes (large for accessibility)
  buttonLarge: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  buttonSmall: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
} as const;
