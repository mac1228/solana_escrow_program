import React, { useState, useRef } from "react";
import "./App.css";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Button, Input } from "@mui/material";
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

  const bioAccontKeypairRef = useRef(web3.Keypair.generate());
  const [bioAccountName, setBioAccountName] = useState<string>();
  const nameInputRef = useRef<HTMLInputElement>();
  const NO_NAME = "No Name";

  const onCreateNameClick = async () => {
    try {
      const name = nameInputRef.current?.value || NO_NAME;
      await program.rpc.createBioAccount(name, {
        accounts: {
          bioAccount: bioAccontKeypairRef.current.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [bioAccontKeypairRef.current],
      });
      enqueueSnackbar("Created Bio account", { variant: "success" });
      const account = await program.account.bioAccount.fetch(
        bioAccontKeypairRef.current.publicKey
      );
      setBioAccountName(account.name);
    } catch (err) {
      enqueueSnackbar("Failed to create Bio account", { variant: "error" });
    }
  };

  const onUpdateNameClick = async () => {
    try {
      const updatedName = nameInputRef.current?.value || NO_NAME;
      await program.rpc.updateName(updatedName, {
        accounts: {
          bioAccount: bioAccontKeypairRef.current.publicKey,
        },
      });
      enqueueSnackbar("Updated Bio account", { variant: "success" });
      const account = await program.account.bioAccount.fetch(
        bioAccontKeypairRef.current.publicKey
      );
      setBioAccountName(account.name);
    } catch (err) {
      enqueueSnackbar("Failed to update Bio account", { variant: "error" });
    }
  };

  const handleEnterKeypress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      bioAccountName ? onUpdateNameClick() : onCreateNameClick();
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
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex" }}>
            <h1 style={{ marginRight: "1rem" }}>
              {bioAccountName ? `Welcome ${bioAccountName}!` : "Welcome!"}
            </h1>
            {/* {bioAccountName ? <h1>{bioAccountName}</h1> : <h1>Who are you?</h1>} */}
          </div>
          <div style={{ display: "flex" }}>
            <Input
              style={{ marginRight: "1rem" }}
              placeholder="Type name here"
              inputRef={nameInputRef}
              onKeyDown={handleEnterKeypress}
            ></Input>
            {bioAccountName ? (
              <Button variant="contained" onClick={onUpdateNameClick}>
                Update Name
              </Button>
            ) : (
              <Button variant="contained" onClick={onCreateNameClick}>
                Create Name
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
