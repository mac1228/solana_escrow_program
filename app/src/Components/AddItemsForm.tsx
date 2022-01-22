import React, { useRef } from "react";
import { Button, TextField } from "@mui/material";
import * as anchor from "@project-serum/anchor";
import { useSnackbar } from "notistack";
import { createItemAccount, getAllItemAccounts } from "Helper";
import { ItemAccount } from "Classes";

interface IAddItemsForm {
  setItemAccounts: React.Dispatch<
    React.SetStateAction<ItemAccount[] | undefined>
  >;
  program?: anchor.Program<anchor.Idl>;
  provider?: anchor.Provider;
}

export function AddItemsForm(props: IAddItemsForm) {
  const { setItemAccounts, program, provider } = props;
  const { enqueueSnackbar } = useSnackbar();
  const itemNameRef = useRef<HTMLInputElement>();
  const marketNameRef = useRef<HTMLInputElement>();
  const supplyRef = useRef<HTMLInputElement>();
  const marginRight = "2rem";

  const onAddItemClick = async () => {
    const itemName = itemNameRef.current?.value;
    const itemMarket = marketNameRef.current?.value;
    const supply = supplyRef.current?.value;
    if (itemName && itemMarket && supply && program && provider) {
      try {
        await createItemAccount(
          provider,
          program,
          itemName,
          itemMarket,
          new anchor.BN(supply)
        );
        enqueueSnackbar("Created Item account", { variant: "success" });
        getAllItemAccounts(program, setItemAccounts);
      } catch (err) {
        enqueueSnackbar("Failed to create Item account", { variant: "error" });
      }
    } else {
      enqueueSnackbar("Must provide value for all fields", {
        variant: "error",
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        marginTop: "1rem",
        marginBottom: "4rem",
      }}
    >
      <TextField
        label="Item Name"
        inputRef={itemNameRef}
        variant="standard"
        style={{ marginRight }}
      />
      <TextField
        label="Market Name"
        inputRef={marketNameRef}
        variant="standard"
        style={{ marginRight }}
      />
      <TextField
        label="Supply"
        inputRef={supplyRef}
        variant="standard"
        style={{ marginRight }}
      />
      <Button variant="contained" onClick={onAddItemClick}>
        Add item to market
      </Button>
    </div>
  );
}
