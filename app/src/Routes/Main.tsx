import React, { useEffect, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import idl from "../idl.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Grid } from "@mui/material";
import { HeaderBar, AddItemsForm, Item } from "Components";
import { getAllItemAccounts } from "Helper";
import { ItemAccount } from "Classes";

export function Main() {
  const wallet = useAnchorWallet();
  const network = "http://127.0.0.1:8899";
  const [program, setProgram] = useState<anchor.Program>();
  const [provider, setProvider] = useState<anchor.Provider>();
  const [itemAccounts, setItemAccounts] = useState<ItemAccount[]>();

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

  return (
    <div>
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
        <AddItemsForm
          setItemAccounts={setItemAccounts}
          program={program}
          provider={provider}
        />
        <Grid
          style={{ width: "95%" }}
          container
          spacing={2}
          justifyContent={"flex-start"}
          alignItems={"center"}
        >
          {itemAccounts?.map((item) => (
            <Grid item xs={6} lg={4} key={item.itemPublicKey.toBase58()}>
              <Item item={item} provider={provider} />
            </Grid>
          ))}
        </Grid>
      </div>
    </div>
  );
}
