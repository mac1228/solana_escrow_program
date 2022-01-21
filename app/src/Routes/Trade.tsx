import React, { useState, useEffect } from "react";
import { HeaderBar } from "Components";
import { TextField, MenuItem, Button } from "@mui/material";
import { EscrowContext } from "Helper";
import { useParams } from "react-router-dom";
import { ItemAccount } from "Classes";
import * as anchor from "@project-serum/anchor";

export function Trade() {
  const params = useParams();
  const { itemAccounts, wallet, provider } = React.useContext(EscrowContext);
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
          <Button variant="contained">Submit Offer</Button>
        </div>
      )}
    </>
  );
}
