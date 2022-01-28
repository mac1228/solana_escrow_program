import React, { useEffect, useContext, useState } from "react";
import { HeaderBar } from "Components";
import { EscrowContext } from "Helper";
import * as anchor from "@project-serum/anchor";
import { Grid, Box } from "@mui/material";
import { ItemAccount } from "Classes";

export function Offers() {
  const { program, itemAccounts, provider } = useContext(EscrowContext);
  const [offers, setOffers] = useState<ItemAccount[]>();

  useEffect(() => {
    const getAllOffers = async (
      program: anchor.Program,
      itemAccounts: ItemAccount[],
      provider: anchor.Provider
    ) => {
      const allOffers = await program.account.offer.all();
      console.log(allOffers);
      const allOffersParsed = allOffers.map((offer) => {
        return (
          itemAccounts.find(async (item) => {
            const tokenAccountInfo =
              await provider.connection.getParsedAccountInfo(
                offer.account.initializerTokenAccount
              );
            return item.getMintPublicKey().toBase58() === "";
          }) || ({} as ItemAccount)
        );
      });
      setOffers(allOffersParsed);
    };
    if (program && itemAccounts && provider) {
      getAllOffers(program, itemAccounts, provider);
    }
  }, [program, itemAccounts, provider]);

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
        <h1>Offers Made</h1>
        <Grid
          style={{ width: "95%" }}
          container
          spacing={2}
          justifyContent={"flex-start"}
          alignItems={"center"}
        >
          {offers?.map((offer) => (
            <Grid item key={offer.getItemPublicKey().toBase58()}>
              {offer.getName()}
            </Grid>
          ))}
        </Grid>
        <h1>Offers Received</h1>
      </div>
    </>
  );
}
