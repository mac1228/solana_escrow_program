import React, { useRef } from "react";
import "./App.css";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Button, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import { HeaderBar } from "Components";

export default function App() {
  const opts: web3.ConfirmOptions = {
    preflightCommitment: "processed",
  };
  const programID = new web3.PublicKey(idl.metadata.address);
  const { enqueueSnackbar } = useSnackbar();
  const wallet = useAnchorWallet();
  const network = "http://127.0.0.1:8899";
  const connection = new web3.Connection(network, opts.preflightCommitment);
  let program = {} as anchor.Program;
  let provider = {} as anchor.Provider;
  if (wallet) {
    provider = new anchor.Provider(connection, wallet, opts);
    program = new anchor.Program(idl as anchor.Idl, programID, provider);
  }

  const mintPublicKeyRef = useRef<HTMLInputElement>();
  const itemNameRef = useRef<HTMLInputElement>();
  const marketNameRef = useRef<HTMLInputElement>();

  const onAddItemClick = async () => {
    try {
      const mintPublicKey = web3.Keypair.generate().publicKey;
      const itemName = itemNameRef.current?.value;
      const marketName = marketNameRef.current?.value;
      if (mintPublicKey && itemName && marketName) {
        const itemAccount = web3.Keypair.generate();
        await program.rpc.createItemAccount(
          mintPublicKey,
          itemName,
          marketName,
          {
            accounts: {
              itemAccount: itemAccount.publicKey,
              user: provider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            },
            signers: [itemAccount],
          }
        );
        enqueueSnackbar("Created Item account", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to create Item account", { variant: "error" });
    }
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
        <h1>Add your items to the market!</h1>
        <div
          style={{
            display: "flex",
            width: "50%",
            justifyContent: "space-between",
          }}
        >
          <TextField
            label="Mint Public Key"
            inputRef={mintPublicKeyRef}
            variant="standard"
          />
          <TextField
            label="Item Name"
            inputRef={itemNameRef}
            variant="standard"
          />
          <TextField
            label="Market Name"
            inputRef={marketNameRef}
            variant="standard"
          />
          <Button variant="contained" onClick={onAddItemClick}>
            Add item to market
          </Button>
        </div>
      </div>
    </div>
  );
}
