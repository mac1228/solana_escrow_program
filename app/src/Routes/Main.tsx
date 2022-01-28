import React, { useEffect } from "react";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import idl from "../idl.json";
import { Grid } from "@mui/material";
import { HeaderBar, AddItemsForm, Item } from "Components";
import { getAllItemAccounts, EscrowContext } from "Helper";

export function Main() {
  const {
    wallet,
    network,
    setProvider,
    setProgram,
    program,
    setItemAccounts,
    provider,
    itemAccounts,
  } = React.useContext(EscrowContext);

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
  }, [wallet, network, setProgram, setProvider]);

  useEffect(() => {
    if (program) {
      getAllItemAccounts(program, setItemAccounts);
    }
  }, [program, setItemAccounts]);

  return (
    <>
      <HeaderBar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1>Add your items to the market!</h1>
        <AddItemsForm />
        <Grid
          style={{ width: "95%" }}
          container
          spacing={2}
          justifyContent={"flex-start"}
          alignItems={"center"}
        >
          {itemAccounts?.map((item) => (
            <Grid item xs={6} lg={4} key={item.getItemPublicKey().toBase58()}>
              <Item item={item} provider={provider} />
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  );
}
