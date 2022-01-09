import React, { useCallback } from "react";
import "./App.css";
import { Connection, PublicKey, ConfirmOptions } from "@solana/web3.js";
import { Program, Provider, Idl } from "@project-serum/anchor";
import idl from "./idl.json";
import { WalletError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletDialogProvider,
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-material-ui";
import {
  useAnchorWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
  Toolbar,
  Typography,
  AppBar,
  Button,
} from "@mui/material";
import DisconnectIcon from "@mui/icons-material/LinkOff";
import { deepPurple } from "@mui/material/colors";
import { SnackbarProvider, useSnackbar } from "notistack";

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

const wallets = [new PhantomWalletAdapter()];
const opts: ConfirmOptions = {
  preflightCommitment: "processed",
};
const programID = new PublicKey(idl.metadata.address);

function App() {
  const { enqueueSnackbar } = useSnackbar();
  const wallet = useAnchorWallet();
  const network = "http://127.0.0.1:8899";
  const connection = new Connection(network, opts.preflightCommitment);
  let program: Program;
  let provider: Provider;
  if (wallet) {
    provider = new Provider(connection, wallet, opts);
    program = new Program(idl as Idl, programID, provider);
  }

  const initializeAccount = async () => {
    await program.rpc.initialize({});
    enqueueSnackbar("Initialized Account", { variant: "success" });
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar style={{ display: "flex" }}>
          <Typography component="h1" variant="h6" style={{ flexGrow: 1 }}>
            Solana Escrow Program
          </Typography>
          <WalletMultiButton />
          {wallet && (
            <WalletDisconnectButton
              startIcon={<DisconnectIcon />}
              style={{ marginLeft: 8 }}
            />
          )}
        </Toolbar>
      </AppBar>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "2rem",
        }}
      >
        <Button variant={"contained"} onClick={initializeAccount}>
          Initialize Account
        </Button>
        <div>Hello World</div>
      </div>
    </div>
  );
}

const AppWithWalletProviders = () => {
  const { enqueueSnackbar } = useSnackbar();
  const onError = useCallback(
    (error: WalletError) => {
      enqueueSnackbar(
        error.message ? `${error.name}: ${error.message}` : error.name,
        { variant: "error" }
      );
      console.error(error);
    },
    [enqueueSnackbar]
  );

  return (
    <ConnectionProvider endpoint="http://127.0.0.1:8899">
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletDialogProvider>
          <App />
        </WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const AppWithAllProviders = () => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <AppWithWalletProviders />
        </SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default AppWithAllProviders;
