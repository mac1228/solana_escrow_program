import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaEscrow } from '../target/types/solana_escrow';
import { createAccountRentExempt, createMintAndVault, createTokenAccount, getMintInfo, getTokenAccount } from '@project-serum/common';
import { transfer, mintTo } from '@project-serum/serum/lib/token-instructions';
import * as assert from "assert";

describe('solana_escrow', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = (anchor as any).workspace.SolanaEscrow as Program<SolanaEscrow>;

  const bioAccount = anchor.web3.Keypair.generate();

  it("Creates bio account", async () => {
    // Create keybpair for Blah Account
    
    const name = "Michael Curd";

    // Make rpc request to Solana program to create Bio Account with "Michael Curd" in the name field
    await program.rpc.createBioAccount(name, {
      accounts: {
        bioAccount: bioAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [bioAccount]
    });

    // fetch newly created bio account
    const account = await program.account.bioAccount.fetch(bioAccount.publicKey);

    // assert that account name is "Michael Curd"
    assert.ok(account.name === name);
  });

  it("Updates name in bio account", async () => {
    const updatedName = "Michael Armon Curd";
    await program.rpc.updateName(updatedName, {
      accounts: {
        bioAccount: bioAccount.publicKey
      }
    });

    const account = await program.account.bioAccount.fetch(bioAccount.publicKey);
    assert.ok(account.name === updatedName);
  });

  it("Creates new token", async () => {
    // Create new mint account and mint some tokens
    const initialTokenSupply = new anchor.BN(200);
    const [mintPublicKey, vaultPublicKey] = await createMintAndVault(provider, initialTokenSupply);
    // Check token supply
    let mintInfo = await getMintInfo(provider, mintPublicKey);
    assert.ok(mintInfo.supply.eq(initialTokenSupply));
    // Create new System Program account
    const newAccount = await createAccountRentExempt(provider, anchor.web3.SystemProgram.programId, 0);
    // Create token account for this new account
    const tokenAccountPublicKey = await createTokenAccount(provider, mintPublicKey, newAccount.publicKey);
    // Transfer tokens to this new token account
    const tokenTransferAmount = new anchor.BN(40);
    const instruction = transfer({
      source: vaultPublicKey,
      destination: tokenAccountPublicKey,
      amount: tokenTransferAmount,
      owner: provider.wallet.publicKey,
    });
    const tx = new anchor.web3.Transaction();
    tx.add(instruction);
    await provider.send(tx);
    // Check token supply
    mintInfo = await getMintInfo(provider, mintPublicKey);
    assert.ok(mintInfo.supply.eq(initialTokenSupply));
    // Check my token account
    let myTokenAccount = await getTokenAccount(provider, vaultPublicKey); 
    assert.ok(myTokenAccount.amount.eq(initialTokenSupply.sub(tokenTransferAmount)));
    // Check other token account
    let otherTokenAccount = await getTokenAccount(provider, tokenAccountPublicKey);
    assert.ok(otherTokenAccount.amount.eq(tokenTransferAmount));

    // Mint to other account
    const mintAmount = new anchor.BN(60);
    const mintInstruction = mintTo({
      mint: mintPublicKey,
      destination: tokenAccountPublicKey,
      amount: mintAmount,
      mintAuthority: provider.wallet.publicKey,
    });
    const mintTransaction = new anchor.web3.Transaction();
    mintTransaction.add(mintInstruction);
    await provider.send(mintTransaction);
    // Check token supply
    mintInfo = await getMintInfo(provider, mintPublicKey);
    assert.ok(mintInfo.supply.eq(initialTokenSupply.add(mintAmount)));
    // Check my token account
    myTokenAccount = await getTokenAccount(provider, vaultPublicKey); 
    assert.ok(myTokenAccount.amount.eq(initialTokenSupply.sub(tokenTransferAmount)));
    // Check other token account
    otherTokenAccount = await getTokenAccount(provider, tokenAccountPublicKey);
    assert.ok(otherTokenAccount.amount.eq(tokenTransferAmount.add(mintAmount)));
  });
});
