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

  it("Creates blah account", async () => {
    // Create keybpair for Blah Account
    const blahAccount = anchor.web3.Keypair.generate();
    const bigNumber = new anchor.BN(150);

    // Make rpc request to program to Blah Account with 150 in it's data field
    await program.rpc.createBlahAccount(bigNumber, {
      accounts: {
        blahAccount: blahAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [blahAccount]
    });

    // fetch newly created blah account
    const account = await program.account.blahAccount.fetch(blahAccount.publicKey);

    // assert that account data is 150
    assert.ok(account.data.eq(bigNumber))
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
