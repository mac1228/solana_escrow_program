import React, { useEffect, useContext } from "react";
import * as anchor from "@project-serum/anchor";
import { EscrowContext } from "Helper";
import "./OfferItem.css";

interface IOfferItem {
  offer: anchor.ProgramAccount;
}

export function OfferItem(props: IOfferItem) {
  const { offer } = props;
  const { provider } = useContext(EscrowContext);

  useEffect(() => {
    const getOfferTokenAccount = async (provider: anchor.Provider) => {
      const tokenAccountInfo = await provider.connection.getParsedAccountInfo(
        offer.account.initializerTokenAccount
      );
      console.log(tokenAccountInfo);
    };

    if (provider) {
      getOfferTokenAccount(provider);
    }
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px white solid",
        padding: "1rem",
      }}
    >
      <div>Initializer:</div>
      <div className="OfferField">{offer.account.initializer.toBase58()}</div>
      <div>Item to give:</div>
      <div className="OfferField">
        {offer.account.initializerTokenAccount.toBase58()}
      </div>
      <div>Give amount:</div>
      <div className="OfferField">{offer.account.giveAmount.toString()}</div>
      <div>Item to receive:</div>
      <div className="OfferField">
        {offer.account.takerTokenAccount.toBase58()}
      </div>
      <div>Receive amount:</div>
      <div>{offer.account.receiveAmount.toString()}</div>
    </div>
  );
}
