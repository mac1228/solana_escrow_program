import React from "react";
import { IItemAccount } from "Classes";
import { Provider } from "@project-serum/anchor";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface IItem {
  item: IItemAccount;
  provider?: Provider;
}

export function Item(props: IItem) {
  const {
    item: { name, market, seller, itemPublicKey },
    provider,
  } = props;
  const navigate = useNavigate();

  const onTradeClick = () => {
    navigate(`/trade/${itemPublicKey.toBase58()}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "2px white solid",
      }}
    >
      <div>{`Item: ${name}`}</div>
      <div>{`Market: ${market}`}</div>
      <div>{`Seller: ${seller.toBase58()}`}</div>
      {provider &&
      seller.toBase58() !== provider.wallet.publicKey.toBase58() ? (
        <Button
          style={{ margin: ".5rem" }}
          variant={"contained"}
          onClick={onTradeClick}
        >
          Trade
        </Button>
      ) : null}
    </div>
  );
}
