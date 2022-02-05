import React, { useContext, useEffect, useState } from "react";
import { HeaderBar } from "Components";
import { EscrowContext } from "Helper";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { Grid } from "@mui/material";
import { ItemAccount } from "Classes";

export function MyItems() {
  const { provider } = useContext(EscrowContext);
  const [tokenAccounts, setTokenAccounts] = useState<
    {
      pubkey: anchor.web3.PublicKey;
      account: anchor.web3.AccountInfo<anchor.web3.ParsedAccountData>;
    }[]
  >();

  useEffect(() => {
    const getTokens = async (provider: anchor.Provider) => {
      const response = await provider.connection.getParsedTokenAccountsByOwner(
        provider.wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      setTokenAccounts(response.value);
    };

    if (provider) {
      getTokens(provider);
    }
  }, [provider]);

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
        <Grid
          style={{ width: "95%" }}
          container
          spacing={2}
          justifyContent={"flex-start"}
          alignItems={"center"}
        >
          {tokenAccounts?.map((token) => {
            return (
              <Grid item key={token.pubkey.toBase58()}>
                <OwnedToken token={token} />
              </Grid>
            );
          })}
        </Grid>
      </div>
    </>
  );
}

interface IOwnedToken {
  token: {
    pubkey: anchor.web3.PublicKey;
    account: anchor.web3.AccountInfo<anchor.web3.ParsedAccountData>;
  };
}

function OwnedToken(props: IOwnedToken) {
  const { itemAccounts, provider } = useContext(EscrowContext);
  const { token } = props;
  const [itemAccount, setItemAccount] = useState<ItemAccount>();

  useEffect(() => {
    const getItemAccount = async (provider: anchor.Provider) => {
      const tokenAccount = await provider.connection.getParsedAccountInfo(
        token.pubkey
      );
      const item = itemAccounts?.find(
        (item) =>
          item.getMintPublicKey().toBase58() ===
          (tokenAccount.value?.data as any).parsed.info.mint
      );
      setItemAccount(item);
    };

    if (provider) {
      getItemAccount(provider);
    }
  }, [itemAccounts, provider, token]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px white solid",
        height: "10rem",
        minWidth: "10rem",
        padding: "2rem",
      }}
    >
      <div>Name: {itemAccount?.getName()}</div>
      <div>Amount: {token.account.data.parsed.info.tokenAmount.uiAmount}</div>
    </div>
  );
}
