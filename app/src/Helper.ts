import React from "react";
import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import { ItemAccount, IItemAccount } from "Classes";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";

export const createItemAccount = async (
  provider: anchor.Provider,
  program: anchor.Program,
  itemName: string,
  itemMarket: string,
  supply: anchor.BN
) => {
  const itemAccount = web3.Keypair.generate();
  const mintAccount = web3.Keypair.generate();
  const tokenAccountPublicKey = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintAccount.publicKey,
    provider.wallet.publicKey
  );

  return program.rpc.createItemAccount(itemName, itemMarket, supply, {
    accounts: {
      itemAccount: itemAccount.publicKey,
      mintAccount: mintAccount.publicKey,
      associatedTokenAccount: tokenAccountPublicKey,
      user: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [itemAccount, mintAccount],
  });
};

export const getAllItemAccounts = async (
  program: anchor.Program,
  setItemAccounts: React.Dispatch<
    React.SetStateAction<ItemAccount[] | undefined>
  >
) => {
  const allItems = await program.account.itemAccount.all();
  console.log(allItems);
  const allItemAccounts = allItems.map((item) => {
    const account: IItemAccount = {
      itemPublicKey: item.publicKey,
      mintPublicKey: item.account.mintPublicKey,
      tokenAccountPublicKey: item.account.tokenAccountPublicKey,
      name: item.account.name,
      market: item.account.market,
      seller: item.account.seller,
    };
    return new ItemAccount(account);
  });
  setItemAccounts(allItemAccounts);
};

export interface IEscrowContext {
  wallet?: AnchorWallet;
  network: string;
  program?: anchor.Program<anchor.Idl>;
  setProgram: React.Dispatch<
    React.SetStateAction<anchor.Program<anchor.Idl> | undefined>
  >;
  provider?: anchor.Provider;
  setProvider: React.Dispatch<
    React.SetStateAction<anchor.Provider | undefined>
  >;
  itemAccounts?: ItemAccount[];
  setItemAccounts: React.Dispatch<
    React.SetStateAction<ItemAccount[] | undefined>
  >;
}

export const EscrowContext = React.createContext({} as IEscrowContext);
