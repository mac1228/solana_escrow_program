import React, { useEffect, useContext, useState } from "react";
import { HeaderBar, OfferItem } from "Components";
import { EscrowContext } from "Helper";
import * as anchor from "@project-serum/anchor";
import { Grid } from "@mui/material";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export function Offers() {
  const { provider } = useContext(EscrowContext);
  const [ownedTokenAccounts, setOwnedTokenAccounts] = useState<any>();

  useEffect(() => {
    const getTokenAccounts = async (provider: anchor.Provider) => {
      const tokenAccounts =
        await provider.connection.getParsedTokenAccountsByOwner(
          provider.wallet.publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );
      setOwnedTokenAccounts(tokenAccounts);
    };
    if (provider) {
      getTokenAccounts(provider);
    }
  }, [provider]);

  return (
    <>
      <HeaderBar />
      <Grid container spacing={1}>
        <Grid
          item
          xs={6}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1>Offers Received</h1>
          {ownedTokenAccounts && (
            <OffersReceivedGrid tokenAccounts={ownedTokenAccounts} />
          )}
        </Grid>
        <Grid
          item
          xs={6}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1>Offers Made</h1>
          <OffersMadeGrid />
        </Grid>
      </Grid>
    </>
  );
}

function OffersMadeGrid() {
  const { program, provider } = useContext(EscrowContext);

  const [offersMade, setOffersMade] = useState<anchor.ProgramAccount[]>();

  useEffect(() => {
    const getOffers = async (
      program: anchor.Program,
      provider: anchor.Provider
    ) => {
      const fetchedOffersMade = await program.account.offer.all([
        {
          memcmp: {
            offset: 8,
            bytes: provider.wallet.publicKey.toBase58(),
          },
        },
      ]);
      setOffersMade(fetchedOffersMade);
    };
    if (program && provider) {
      getOffers(program, provider);
    }
  }, [program, provider]);

  return offersMade ? (
    <Grid container spacing={2} justifyContent={"space-around"}>
      {offersMade.map((offer) => (
        <Grid item key={offer.publicKey.toBase58()}>
          <OfferItem offer={offer} />
        </Grid>
      ))}
    </Grid>
  ) : null;
}

interface IOffersReceivedGrid {
  tokenAccounts: any;
}

function OffersReceivedGrid(props: IOffersReceivedGrid) {
  const { program } = useContext(EscrowContext);
  const { tokenAccounts } = props;
  const [offersReceived, setOffersReceived] = useState<any[]>();

  useEffect(() => {
    const getOffers = async (program: anchor.Program) => {
      const promiseOffers: Promise<any>[] = [];
      tokenAccounts.value.forEach((token: any) => {
        const offers = program.account.offer.all([
          {
            memcmp: {
              offset: 72,
              bytes: token.pubkey.toBase58(),
            },
          },
        ]);
        promiseOffers.push(offers);
      });
      const fetchedOffers = await Promise.all(promiseOffers);
      const singleOffers = fetchedOffers
        .filter((offer) => offer.length)
        .map((offer) => offer[0]);
      setOffersReceived(singleOffers);
    };

    if (program) {
      getOffers(program);
    }
  }, [program, tokenAccounts]);

  return offersReceived ? (
    <Grid container spacing={2} justifyContent={"space-around"}>
      {offersReceived.map((offer) => (
        <Grid item key={offer.publicKey.toBase58()}>
          <OfferItem offer={offer} />
        </Grid>
      ))}
    </Grid>
  ) : null;
}
