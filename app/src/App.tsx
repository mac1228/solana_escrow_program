import React, { useRef } from "react";
import "./App.css";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Button, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import { HeaderBar } from "Components";
import { TokenInstructions } from "@project-serum/serum";

export default function App() {
  const opts: web3.ConfirmOptions = {
    preflightCommitment: "processed",
  };
  const programID = new web3.PublicKey(idl.metadata.address);
  const { enqueueSnackbar } = useSnackbar();
  const wallet = useAnchorWallet();
  const network = "http://127.0.0.1:8899";
  const connection = new web3.Connection(network, opts.preflightCommitment);
  let program = {} as anchor.Program;
  let provider = {} as anchor.Provider;
  if (wallet) {
    provider = new anchor.Provider(connection, wallet, opts);
    program = new anchor.Program(idl as anchor.Idl, programID, provider);
  }

  const itemNameRef = useRef<HTMLInputElement>();
  const marketNameRef = useRef<HTMLInputElement>();
  const supplyRef = useRef<HTMLInputElement>();

  const onAddItemClick = async () => {
    const itemName = itemNameRef.current?.value;
    const itemMarket = marketNameRef.current?.value;
    const supply = supplyRef.current?.value;
    if (itemName && itemMarket && supply) {
      try {
        // Create keypairs for all accounts you'll be creating
        const itemAccount = web3.Keypair.generate();
        const mintAccount = web3.Keypair.generate();
        const tokenAccount = web3.Keypair.generate();

        // Create transaction
        const tx = new web3.Transaction();

        // Add instructions to create mint account, create token account, and mint to token account
        tx.add(
          web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: mintAccount.publicKey,
            space: 82,
            lamports:
              await provider.connection.getMinimumBalanceForRentExemption(82),
            programId: TokenInstructions.TOKEN_PROGRAM_ID,
          }),
          TokenInstructions.initializeMint({
            mint: mintAccount.publicKey,
            decimals: 0,
            mintAuthority: provider.wallet.publicKey,
          }),
          web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: tokenAccount.publicKey,
            space: 165,
            lamports:
              await provider.connection.getMinimumBalanceForRentExemption(165),
            programId: TokenInstructions.TOKEN_PROGRAM_ID,
          }),
          TokenInstructions.initializeAccount({
            account: tokenAccount.publicKey,
            mint: mintAccount.publicKey,
            owner: provider.wallet.publicKey,
          }),
          TokenInstructions.mintTo({
            mint: mintAccount.publicKey,
            destination: tokenAccount.publicKey,
            amount: supply,
            mintAuthority: provider.wallet.publicKey,
          })
        );

        // Add instruction to create item account
        tx.add(
          program.instruction.createItemAccount(itemName, itemMarket, {
            accounts: {
              itemAccount: itemAccount.publicKey,
              mintAccount: mintAccount.publicKey,
              user: provider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            },
            signers: [itemAccount],
          })
        );

        // Send transaction
        await provider.send(tx, [mintAccount, tokenAccount, itemAccount]);
        enqueueSnackbar("Created Item account", { variant: "success" });
      } catch (err) {
        enqueueSnackbar("Failed to create Item account", { variant: "error" });
      }
    } else {
      enqueueSnackbar("Must provide value for all fields", {
        variant: "error",
      });
    }
  };

  const marginRight = "2rem";

  return (
    <div className="App">
      <HeaderBar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "2rem",
        }}
      >
        <h1>Add your items to the market!</h1>
        <div
          style={{
            display: "flex",
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
      </div>
    </div>
  );
}
