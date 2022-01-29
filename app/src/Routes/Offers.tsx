import React, { useEffect, useContext, useState } from "react";
import { HeaderBar, OfferItem } from "Components";
import { EscrowContext } from "Helper";
import * as anchor from "@project-serum/anchor";
import { Grid } from "@mui/material";

export function Offers() {
  const { program, provider } = useContext(EscrowContext);
  const [myOffers, setMyOffers] = useState<anchor.ProgramAccount[]>();

  useEffect(() => {
    const getMyOffers = async (
      program: anchor.Program,
      provider: anchor.Provider
    ) => {
      const offers = await program.account.offer.all([
        {
          memcmp: {
            offset: 8,
            bytes: provider.wallet.publicKey.toBase58(),
          },
        },
      ]);
      console.log(offers);
      setMyOffers(offers);
    };
    if (program && provider) {
      getMyOffers(program, provider);
    }
  }, [program, provider]);

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
        {myOffers && (
          <Grid
            style={{ width: "95%" }}
            container
            spacing={2}
            justifyContent={"flex-start"}
            alignItems={"center"}
          >
            {myOffers.map((offer) => (
              <Grid item key={offer.publicKey.toBase58()}>
                <OfferItem offer={offer} />
              </Grid>
            ))}
          </Grid>
        )}
        <h1>Offers Received</h1>
      </div>
    </>
  );
}
