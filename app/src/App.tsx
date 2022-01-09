import React from "react";
import "./App.css";
import { Connection, PublicKey, ConfirmOptions } from "@solana/web3.js";
import { Program, Provider, Idl } from "@project-serum/anchor";
import idl from "./idl.json";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-material-ui";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Toolbar, Typography, AppBar, Button } from "@mui/material";
import DisconnectIcon from "@mui/icons-material/LinkOff";
import { useSnackbar } from "notistack";

export default function App() {
  const opts: ConfirmOptions = {
    preflightCommitment: "processed",
  };
  const programID = new PublicKey(idl.metadata.address);
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
        <div>Hello World</div>
        <Button variant={"contained"} onClick={initializeAccount}>
          Initialize Account
        </Button>
      </div>
    </div>
  );
}
