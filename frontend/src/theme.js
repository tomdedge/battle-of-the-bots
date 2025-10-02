import { createTheme } from '@mantine/core';

export const theme = createTheme({
  colors: {
    aura: [
      '#EFE2D3', // 0 - background light
      '#14BADB', // 1 - primary teal
      '#1D9BBB', // 2 - secondary teal
      '#DA7576', // 3 - accent rose
      '#854B58', // 4 - dark rose-brown
      '#14BADB', // 5
      '#1D9BBB', // 6
      '#DA7576', // 7
      '#854B58', // 8
      '#854B58'  // 9
    ]
  },
  primaryColor: 'aura',
  primaryShade: 1,
  other: {
    backgroundLight: '#EFE2D3',
    backgroundDark: '#854B58',
    textLight: '#854B58',
    textDark: '#EFE2D3'
  }
});
