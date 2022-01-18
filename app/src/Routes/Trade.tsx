import React, { useState } from "react";
import { HeaderBar } from "Components";
import { TextField, MenuItem, Button } from "@mui/material";
import { EscrowContext } from "Helper";
import { useParams } from "react-router-dom";

export function Trade() {
  const { itemAccounts, wallet } = React.useContext(EscrowContext);
  const [itemSelection, setItemSelection] = useState();
  const [give, setGive] = useState();
  const [receive, setReceive] = useState();
  const params = useParams();
  const otherItem = itemAccounts?.find((item) => {
    return item.itemPublicKey.toBase58() === params.itemId;
  });

  const handleItemSelectionChange = (event: any) => {
    setItemSelection(event.target.value);
  };

  const handleGiveChange = (event: any) => {
    setGive(event.target.value);
  };

  const handleReceiveChange = (event: any) => {
    setReceive(event.target.value);
  };

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
            value={itemSelection}
            helperText="Please select what item you'd like to give"
            onChange={handleItemSelectionChange}
            style={{ marginBottom: "2rem" }}
          >
            {itemAccounts
              .filter((item) => item.seller.equals(wallet.publicKey))
              .map((item) => (
                <MenuItem key={item.itemPublicKey.toBase58()} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            type="number"
            value={give}
            onChange={handleGiveChange}
            helperText="Give quantity"
            style={{ marginBottom: "2rem" }}
          />
          <TextField
            disabled
            value={otherItem?.name}
            helperText="Item you'll receive"
            style={{ marginBottom: "2rem" }}
          />
          <TextField
            type="number"
            value={receive}
            onChange={handleReceiveChange}
            helperText="Receive quantity"
            style={{ marginBottom: "2rem" }}
          />
          <Button variant="contained">Submit Offer</Button>
        </div>
      )}
    </>
  );
}
