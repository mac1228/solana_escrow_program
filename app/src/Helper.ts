import * as anchor from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import { TokenInstructions } from "@project-serum/serum";
import { ItemAccount, IItemAccount } from "Classes";

export const createItemAccount = async (
  provider: anchor.Provider,
  program: anchor.Program,
  itemName: string,
  itemMarket: string,
  supply: anchor.BN
) => {
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
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
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
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        165
      ),
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
  return provider.send(tx, [mintAccount, tokenAccount, itemAccount]);
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
      mintPublicKey: item.account.mintPublicKey,
      name: item.account.name,
      market: item.account.market,
      seller: item.account.seller,
    };
    return new ItemAccount(item.publicKey, account);
  });
  setItemAccounts(allItemAccounts);
};
