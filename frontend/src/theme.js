export const pastelTheme = {
    palette: {
      mode: 'light',
      primary: {
        main: '#a6c1ee', // soft pastel blue
      },
      secondary: {
        main: '#fbc2eb', // soft pastel pink
      },
      info: {
        main: '#b2ebf2', // pastel cyan
      },
      background: {
        default: '#fefefe',
      },
      text: {
        primary: '#333',
      },
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeightRegular: 400,
      fontWeightMedium: 600,
      fontWeightBold: 700,
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
    },
  };