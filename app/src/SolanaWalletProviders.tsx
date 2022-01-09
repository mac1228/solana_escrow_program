import React, { useCallback } from "react";
import "./App.css";
import { WalletError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";
import {
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import { useSnackbar } from "notistack";

interface ISolanaWalletProviders {
  children: React.ReactNode;
}

export default function SolanaWalletProviders(props: ISolanaWalletProviders) {
  const wallets = [new PhantomWalletAdapter()];
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
        <WalletDialogProvider>{props.children}</WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
