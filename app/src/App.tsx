import React from "react";
import "./App.css";
import { Connection, PublicKey, ConfirmOptions } from "@solana/web3.js";
import { Program, Provider, Idl } from "@project-serum/anchor";
import idl from "./idl.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { HeaderBar } from "Components";

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
      <HeaderBar />
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
