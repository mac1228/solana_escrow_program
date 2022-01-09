import * as React from "react";
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import { SnackbarProvider } from "notistack";

const theme = createTheme({
  typography: {
    fontFamily: "IBM Plex Mono",
  },
  palette: {
    mode: "dark",
    primary: {
      main: deepPurple[700],
    },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          justifyContent: "flex-start",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          padding: "12px 16px",
        },
        startIcon: {
          marginRight: 8,
        },
        endIcon: {
          marginLeft: 8,
        },
      },
    },
  },
});

interface IMaterialUIProviderProps {
  children: React.ReactNode;
}

export function MaterialUIProviders(props: IMaterialUIProviderProps) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>{props.children}</SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
