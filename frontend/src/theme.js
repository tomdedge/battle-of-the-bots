import { createTheme } from '@mantine/core';

export const theme = createTheme({
  colors: {
    aura: [
      '#EFE2D3', // 0 - background light
      '#0A8FA8', // 1 - darker primary teal (better contrast)
      '#1D9BBB', // 2 - secondary teal
      '#DA7576', // 3 - accent rose
      '#854B58', // 4 - dark rose-brown
      '#0A8FA8', // 5 - darker teal
      '#1D9BBB', // 6
      '#DA7576', // 7
      '#854B58', // 8
      '#2D1B21'  // 9 - very dark for high contrast
    ]
  },
  primaryColor: 'aura',
  primaryShade: 1,
  other: {
    backgroundLight: '#EFE2D3',
    backgroundDark: '#2D1B21', // Darker background for better contrast
    textLight: '#2D1B21', // Darker text for better contrast
    textDark: '#EFE2D3'
  }
});
