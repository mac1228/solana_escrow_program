import * as anchor from "@project-serum/anchor";
import { Program, web3 } from "@project-serum/anchor";
import { SolanaEscrow } from "../target/types/solana_escrow";
import {
  createAccountRentExempt,
  createMintAndVault,
  createTokenAccount,
  getMintInfo,
  getTokenAccount,
} from "@project-serum/common";
import { TokenInstructions } from "@project-serum/serum";
import * as assert from "assert";

describe("solana_escrow", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = (anchor as any).workspace
    .SolanaEscrow as Program<SolanaEscrow>;

  it("Creates item account", async () => {
    const itemAccount = web3.Keypair.generate();
    const name = "Apples";
    const market = "Fruit";
    const supply = new anchor.BN(200);
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
        lamports: await provider.connection.getMinimumBalanceForRentExemption(
          82
        ),
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
      program.instruction.createItemAccount(name, market, {
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

    // Fetch item account
    const account = await program.account.itemAccount.fetch(
      itemAccount.publicKey
    );

    // assert that item account has correct values
    assert.ok(account.name === name);
    assert.ok(account.market === market);
    assert.ok(account.mintPublicKey.equals(mintAccount.publicKey));
  });

  it("Cannot create item account with long item name", async () => {
    const itemAccount = web3.Keypair.generate();
    const name = "X".repeat(50);
    const market = "Fruit";
    const [mint] = await createMintAndVault(provider, new anchor.BN(20));

    try {
      await program.rpc.createItemAccount(name, market, {
        accounts: {
          itemAccount: itemAccount.publicKey,
          mintAccount: mint,
          user: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [itemAccount],
      });
    } catch (error) {
      assert.equal(error.msg, "The item name is too long");
    }
  });

  it("Creates new token on client", async () => {
    // Create new mint account and mint some tokens
    const initialTokenSupply = new anchor.BN(200);
    const [mintPublicKey, vaultPublicKey] = await createMintAndVault(
      provider,
      initialTokenSupply
    );
    // Check token supply
    let mintInfo = await getMintInfo(provider, mintPublicKey);
    assert.ok(mintInfo.supply.eq(initialTokenSupply));
    // Create new System Program account
    const newAccount = await createAccountRentExempt(
      provider,
      web3.SystemProgram.programId,
      0
    );
    // Create token account for this new account
    const tokenAccountPublicKey = await createTokenAccount(
      provider,
      mintPublicKey,
      newAccount.publicKey
    );
    // Transfer tokens to this new token account
    const tokenTransferAmount = new anchor.BN(40);
    const instruction = TokenInstructions.transfer({
      source: vaultPublicKey,
      destination: tokenAccountPublicKey,
      amount: tokenTransferAmount,
      owner: provider.wallet.publicKey,
    });
    const tx = new web3.Transaction();
    tx.add(instruction);
    await provider.send(tx);
    // Check token supply
    mintInfo = await getMintInfo(provider, mintPublicKey);
    assert.ok(mintInfo.supply.eq(initialTokenSupply));
    // Check my token account
    let myTokenAccount = await getTokenAccount(provider, vaultPublicKey);
    assert.ok(
      myTokenAccount.amount.eq(initialTokenSupply.sub(tokenTransferAmount))
    );
    // Check other token account
    let otherTokenAccount = await getTokenAccount(
      provider,
      tokenAccountPublicKey
    );
    assert.ok(otherTokenAccount.amount.eq(tokenTransferAmount));

    // Mint to other account
    const mintAmount = new anchor.BN(60);
    const mintInstruction = TokenInstructions.mintTo({
      mint: mintPublicKey,
      destination: tokenAccountPublicKey,
      amount: mintAmount,
      mintAuthority: provider.wallet.publicKey,
    });
    const mintTransaction = new web3.Transaction();
    mintTransaction.add(mintInstruction);
    await provider.send(mintTransaction);
    // Check token supply
    mintInfo = await getMintInfo(provider, mintPublicKey);
    assert.ok(mintInfo.supply.eq(initialTokenSupply.add(mintAmount)));
    // Check my token account
    myTokenAccount = await getTokenAccount(provider, vaultPublicKey);
    assert.ok(
      myTokenAccount.amount.eq(initialTokenSupply.sub(tokenTransferAmount))
    );
    // Check other token account
    otherTokenAccount = await getTokenAccount(provider, tokenAccountPublicKey);
    assert.ok(otherTokenAccount.amount.eq(tokenTransferAmount.add(mintAmount)));
  });
});
