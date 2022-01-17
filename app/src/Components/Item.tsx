import React from "react";
import { IItemAccount } from "Classes";

interface IItem {
  item: IItemAccount;
}

export function Item(props: IItem) {
  const {
    item: { name, market, seller },
  } = props;

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
    </div>
  );
}
