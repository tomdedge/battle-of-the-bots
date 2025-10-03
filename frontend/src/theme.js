import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
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
    backgroundLight: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    backgroundDark: 'linear-gradient(135deg, #2D1B21 0%, #1a1a1a 100%)',
    textLight: '#2D1B21',
    textDark: '#EFE2D3',
    userBubbleGradient: 'linear-gradient(135deg, #0A8FA8 0%, #1D9BBB 100%)',
    auraBubbleGradient: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    auraBubbleGradientDark: 'linear-gradient(135deg, #495057 0%, #6c757d 100%)'
  }
});
