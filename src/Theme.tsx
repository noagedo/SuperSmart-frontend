import React from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";


const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});


export const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "'Rubik', 'Assistant', 'Heebo', 'Arial', sans-serif",
  },
  components: {
    MuiTextField: {
      defaultProps: {
        InputProps: {
          style: { textAlign: "right" },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: "right",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          right: 20,
          left: "auto",
          transformOrigin: "right top",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          textAlign: "right",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          textAlign: "right",
          paddingRight: 14,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          textAlign: "right",
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginRight: 0,
          marginLeft: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textAlign: "right",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: "right",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          textAlign: "right",
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
}


const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <CacheProvider value={cacheRtl}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </CacheProvider>
  );
};

export default ThemeProvider;
