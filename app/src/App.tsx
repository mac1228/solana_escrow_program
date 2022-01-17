import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Button, TextField, Grid } from "@mui/material";
import { useSnackbar } from "notistack";
import { HeaderBar } from "Components";
import { createItemAccount, getAllItemAccounts } from "Helper";
import { ItemAccount } from "ItemAccount";

export default function App() {
  const { enqueueSnackbar } = useSnackbar();
  const wallet = useAnchorWallet();
  const network = "http://127.0.0.1:8899";
  const [program, setProgram] = useState<anchor.Program>();
  const [provider, setProvider] = useState<anchor.Provider>();
  const [itemAccounts, setItemAccounts] = useState<ItemAccount[]>();

  const itemNameRef = useRef<HTMLInputElement>();
  const marketNameRef = useRef<HTMLInputElement>();
  const supplyRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if (wallet) {
      const opts: web3.ConfirmOptions = {
        preflightCommitment: "processed",
      };
      const connection = new web3.Connection(network, opts.preflightCommitment);
      const programID = new web3.PublicKey(idl.metadata.address);
      const provider = new anchor.Provider(connection, wallet, opts);
      const program = new anchor.Program(
        idl as anchor.Idl,
        programID,
        provider
      );
      setProvider(provider);
      setProgram(program);
    }
  }, [wallet]);

  useEffect(() => {
    if (program) {
      getAllItemAccounts(program, setItemAccounts);
    }
  }, [program]);

  const onAddItemClick = async () => {
    const itemName = itemNameRef.current?.value;
    const itemMarket = marketNameRef.current?.value;
    const supply = supplyRef.current?.value;
    if (itemName && itemMarket && supply && program && provider) {
      try {
        await createItemAccount(
          provider,
          program,
          itemName,
          itemMarket,
          new anchor.BN(supply)
        );
        enqueueSnackbar("Created Item account", { variant: "success" });
        getAllItemAccounts(program, setItemAccounts);
      } catch (err) {
        enqueueSnackbar("Failed to create Item account", { variant: "error" });
      }
    } else {
      enqueueSnackbar("Must provide value for all fields", {
        variant: "error",
      });
    }
  };

  const marginRight = "2rem";

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
            marginBottom: "2rem",
          }}
        >
          <TextField
            label="Item Name"
            inputRef={itemNameRef}
            variant="standard"
            style={{ marginRight }}
          />
          <TextField
            label="Market Name"
            inputRef={marketNameRef}
            variant="standard"
            style={{ marginRight }}
          />
          <TextField
            label="Supply"
            inputRef={supplyRef}
            variant="standard"
            style={{ marginRight }}
          />
          <Button variant="contained" onClick={onAddItemClick}>
            Add item to market
          </Button>
        </div>
        <Grid container>
          {itemAccounts?.map((item) => (
            <Grid
              item
              xs={3}
              justifyContent={"center"}
              key={item.itemPublicKey.toBase58()}
            >
              <div style={{ textAlign: "center" }}>{item.name}</div>
            </Grid>
          ))}
        </Grid>
      </div>
    </div>
  );
}
