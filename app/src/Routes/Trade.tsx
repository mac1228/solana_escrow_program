import React, { useState, useEffect } from "react";
import { HeaderBar } from "Components";
import { TextField, MenuItem, Button } from "@mui/material";
import { EscrowContext } from "Helper";
import { useParams } from "react-router-dom";
import { ItemAccount } from "Classes";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import { useSnackbar } from "notistack";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export function Trade() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { itemAccounts, wallet, provider, program } =
    React.useContext(EscrowContext);
  const [dropdownItemSelection, setDropdownItemSelection] =
    useState<string>("");
  const [giveAmount, setGiveAmount] = useState<0>(0);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [giveSupply, setGiveSupply] = useState<number>();
  const [giveItem, setGiveItem] = useState<ItemAccount>();
  const receiveItem = itemAccounts?.find((item) => {
    return item.getItemPublicKey().toBase58() === params.itemId;
  });

  const handleDropdownItemSelectionChange = (event: any) => {
    const value = event.target.value;
    const item = itemAccounts?.find(
      (itemAccount) => itemAccount.getName() === value
    );
    if (item) {
      setGiveItem(item);
      setDropdownItemSelection(value);
    }
  };

  const handleGiveAmountChange = (event: any) => {
    setGiveAmount(event.target.value);
  };

  const handleReceiveAmountChange = (event: any) => {
    setReceiveAmount(event.target.value);
  };

  const onSubmitOfferClick = async () => {
    try {
      if (program && receiveItem && giveItem && provider) {
        const giveAmountBN = new anchor.BN(giveAmount);
        const receiveAmountBN = new anchor.BN(receiveAmount);
        const [offer, offerBump] = await web3.PublicKey.findProgramAddress(
          [
            giveItem.getTokenAccountPublicKey().toBuffer(),
            giveAmountBN.toArrayLike(Buffer, "le", 8),
            receiveItem.getTokenAccountPublicKey().toBuffer(),
            receiveAmountBN.toArrayLike(Buffer, "le", 8),
          ],
          program.programId
        );
        const [vault, vaultBump] = await web3.PublicKey.findProgramAddress(
          [
            giveItem.getTokenAccountPublicKey().toBuffer(),
            receiveItem.getTokenAccountPublicKey().toBuffer(),
          ],
          program.programId
        );

        await program.rpc.createOffer(
          giveAmountBN,
          receiveAmountBN,
          offerBump,
          vaultBump,
          {
            accounts: {
              initializer: provider.wallet.publicKey,
              offer: offer,
              initializerTokenAccount: giveItem.getTokenAccountPublicKey(),
              mint: giveItem.getMintPublicKey(),
              vaultTokenAccount: vault,
              takerTokenAccount: receiveItem.getTokenAccountPublicKey(),
              systemProgram: web3.SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [],
          }
        );
        enqueueSnackbar(
          `Created Offer: ${giveAmount} ${giveItem.getName()} for ${receiveAmount} ${receiveItem.getName()}`,
          { variant: "success" }
        );
      }
    } catch (err: any) {
      enqueueSnackbar(`Failed to submit offer: ${err.toString()}`, {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    const getGiveSupply = async (provider: anchor.Provider) => {
      const supply = await giveItem?.getSupply(provider);
      supply && setGiveSupply(supply);
    };
    if (provider) {
      getGiveSupply(provider);
    }
  });

  return (
    <>
      <HeaderBar />
      {itemAccounts && wallet && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TextField
            select
            label="Select"
            value={dropdownItemSelection}
            helperText="Please select what item you'd like to give"
            onChange={handleDropdownItemSelectionChange}
            style={{ marginBottom: "2rem" }}
          >
            {itemAccounts
              .filter((item) => item.getSeller().equals(wallet.publicKey))
              .map((item) => (
                <MenuItem
                  key={item.getItemPublicKey().toBase58()}
                  value={item.getName()}
                >
                  {item.getName()}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            type="number"
            value={giveAmount || ""}
            onChange={handleGiveAmountChange}
            helperText={
              giveSupply
                ? `How much would you like to give? Supply: ${giveSupply}`
                : "Select item to see how much you can give."
            }
            style={{ marginBottom: "2rem" }}
            placeholder="Enter quantity"
          />
          <TextField
            disabled
            value={receiveItem?.getName()}
            helperText="Item you'll receive"
            style={{ marginBottom: "2rem" }}
          />
          <TextField
            type="number"
            value={receiveAmount || ""}
            onChange={handleReceiveAmountChange}
            helperText="How much would you like to receive?"
            style={{ marginBottom: "2rem" }}
            placeholder="Enter quantity"
          />
          <Button variant="contained" onClick={onSubmitOfferClick}>
            Submit Offer
          </Button>
        </div>
      )}
    </>
  );
}
