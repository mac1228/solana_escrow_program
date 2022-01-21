import React from "react";
import { ItemAccount } from "Classes";
import { Provider } from "@project-serum/anchor";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface IItem {
  item: ItemAccount;
  provider?: Provider;
}

export function Item(props: IItem) {
  const { item, provider } = props;
  const navigate = useNavigate();

  const onTradeClick = () => {
    navigate(`/trade/${item.getItemPublicKey().toBase58()}`);
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
      <div>{`Item: ${item.getName()}`}</div>
      <div>{`Market: ${item.getMarket()}`}</div>
      <div>Seller:</div>
      <div>{item.getSeller().toBase58()}</div>
      {provider &&
      item.getSeller().toBase58() !== provider.wallet.publicKey.toBase58() ? (
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
