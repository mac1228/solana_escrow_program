import React, { useContext } from "react";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import { EscrowContext } from "Helper";
import { Button } from "@mui/material";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import "./OfferItem.css";
import { useSnackbar } from "notistack";

interface IOfferItem {
  offer: anchor.ProgramAccount;
}

export function OfferItem(props: IOfferItem) {
  const { offer } = props;
  const { provider, program, itemAccounts } = useContext(EscrowContext);
  const { enqueueSnackbar } = useSnackbar();

  const isInitializer = offer.account.initializer.equals(
    provider?.wallet.publicKey
  );
  const giveItemAccount = itemAccounts?.find((item) =>
    item
      .getTokenAccountPublicKey()
      .equals(offer.account.initializerTokenAccount)
  );
  const takerItemAccount = itemAccounts?.find((item) =>
    item.getTokenAccountPublicKey().equals(offer.account.takerTokenAccount)
  );

  const onCancelOfferClick = async () => {
    try {
      if (program && provider) {
        const offerAccount = offer.account;
        const [vault] = await web3.PublicKey.findProgramAddress(
          [
            offerAccount.initializerTokenAccount.toBuffer(),
            offerAccount.takerTokenAccount.toBuffer(),
          ],
          program.programId
        );

        await program.rpc.cancelOffer({
          accounts: {
            offer: offer.publicKey,
            initializer: provider.wallet.publicKey,
            initializerTokenAccount: offerAccount.initializerTokenAccount,
            vaultTokenAccount: vault,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          signers: [],
        });
        enqueueSnackbar("Cancelled offer", {
          variant: "success",
        });
      }
    } catch (err) {
      enqueueSnackbar(`Failed to cancel offer: ${(err as any).toString()}`, {
        variant: "error",
      });
    }
  };

  const onAcceptOfferClick = async () => {
    try {
      if (provider && program) {
        const offerAccount = offer.account;
        const giveAmount = offerAccount.receiveAmount;
        const [vault] = await web3.PublicKey.findProgramAddress(
          [
            offerAccount.initializerTokenAccount.toBuffer(),
            offerAccount.takerTokenAccount.toBuffer(),
          ],
          program.programId
        );

        // Get associated token account for taker to receive tokens
        const initializerTokenAccountInfo =
          await provider.connection.getParsedAccountInfo(
            offerAccount.initializerTokenAccount
          );
        const initializerMintBase58: string = (
          initializerTokenAccountInfo.value?.data as any
        ).parsed.info.mint;
        const initializerMintPublicKey = new web3.PublicKey(
          initializerMintBase58
        );
        const takerReceiveTokenAccount = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          initializerMintPublicKey,
          provider.wallet.publicKey
        );

        // Get associated token account for taker to receive tokens
        const takerTokenAccountInfo =
          await provider.connection.getParsedAccountInfo(
            offerAccount.takerTokenAccount
          );
        const takerMintBase58: string = (
          takerTokenAccountInfo.value?.data as any
        ).parsed.info.mint;
        const takerMintPublicKey = new web3.PublicKey(takerMintBase58);

        const initializerReceiveTokenAccount =
          await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            takerMintPublicKey,
            offerAccount.initializer
          );

        await program.rpc.acceptOffer(giveAmount, {
          accounts: {
            offer: offer.publicKey,
            taker: provider.wallet.publicKey,
            initializer: offerAccount.initializer,
            takerGiveTokenAccount: offerAccount.takerTokenAccount,
            vaultTokenAccount: vault,
            takerReceiveTokenAccount,
            initializerReceiveTokenAccount,
            takerMint: takerMintPublicKey,
            initializerMint: initializerMintPublicKey,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
          signers: [],
        });

        enqueueSnackbar("Accepted offer!", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar(`Failed to accept offer: ${(err as any).toString()}`, {
        variant: "error",
      });
    }
  };

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
      <div className="OfferField">
        {isInitializer ? "You" : offer.account.initializer.toBase58()}
      </div>
      <div>{isInitializer ? "Item you'll give:" : "Item you'll receive:"}</div>
      <div className="OfferField">{giveItemAccount?.getName()}</div>
      <div>{isInitializer ? "Give amount:" : "Receive amount:"}</div>
      <div className="OfferField">{offer.account.giveAmount.toString()}</div>
      <div>{isInitializer ? "Item you'll receive:" : "Item you'll give:"}</div>
      <div className="OfferField">{takerItemAccount?.getName()}</div>
      <div>{isInitializer ? "Receive amount:" : "Give amount:"}</div>
      <div>{offer.account.receiveAmount.toString()}</div>
      {isInitializer ? (
        <Button
          className="AcceptItem"
          variant={"contained"}
          onClick={onCancelOfferClick}
        >
          Cancel Offer
        </Button>
      ) : (
        <Button
          className="AcceptItem"
          variant={"contained"}
          onClick={onAcceptOfferClick}
        >
          Accept Offer
        </Button>
      )}
    </div>
  );
}
