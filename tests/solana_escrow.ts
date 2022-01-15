import * as anchor from '@project-serum/anchor';
import { Program, web3 } from '@project-serum/anchor';
import { SolanaEscrow } from '../target/types/solana_escrow';
import { createAccountRentExempt, createMintAndVault, createTokenAccount, getMintInfo, getTokenAccount } from '@project-serum/common';
import { transfer, mintTo } from '@project-serum/serum/lib/token-instructions';
import * as assert from "assert";

describe('solana_escrow', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = (anchor as any).workspace.SolanaEscrow as Program<SolanaEscrow>;

  it("Creates item account", async () => { 
    const itemAccount = web3.Keypair.generate();   
    const name = "Apples";
    const market = "Fruit";
    const supply = new anchor.BN(200);
    const [mintPublicKey] = await createMintAndVault(provider, supply);

    // Make rpc request to Solana program to create Item account for Apples in the Fruit market
    await program.rpc.createItemAccount(name, market, {
      accounts: {
        itemAccount: itemAccount.publicKey,
        mintAccount: mintPublicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [itemAccount]
    });

    // fetch newly created item account
    const account = await program.account.itemAccount.fetch(itemAccount.publicKey);

    // assert that item account has correct values
    assert.ok(account.name === name);
    assert.ok(account.market === market);
    assert.ok(account.mintPublicKey.equals(mintPublicKey));
  });

  it("Creates new token on client", async () => {
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
