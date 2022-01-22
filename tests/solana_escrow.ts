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
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import * as assert from "assert";

describe("solana_escrow", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = (anchor as any).workspace
    .SolanaEscrow as Program<SolanaEscrow>;
  let tokenAccountPublicKey: web3.PublicKey;

  it("Creates item account", async () => {
    const itemAccount = web3.Keypair.generate();
    const name = "Apples";
    const market = "Fruit";
    const supply = new anchor.BN(200);
    const mintAccount = web3.Keypair.generate();
    tokenAccountPublicKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      provider.wallet.publicKey
    );

    await program.rpc.createItemAccount(name, market, supply, {
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

    // Fetch item account
    const fetchedItemAccount = await program.account.itemAccount.fetch(
      itemAccount.publicKey
    );

    // assert that item account has correct values
    assert.ok(fetchedItemAccount.name === name);
    assert.ok(fetchedItemAccount.market === market);
    assert.ok(fetchedItemAccount.mintPublicKey.equals(mintAccount.publicKey));
    assert.ok(
      fetchedItemAccount.tokenAccountPublicKey.equals(tokenAccountPublicKey)
    );
    assert.ok(
      fetchedItemAccount.seller.toBase58() ===
        provider.wallet.publicKey.toBase58()
    );

    // Fetch token account info
    const tokenAccountInfo = await provider.connection.getParsedAccountInfo(
      tokenAccountPublicKey
    );
    const tokenAccountData = (tokenAccountInfo.value.data as any).parsed.info;
    const tokenOwner = tokenAccountData.owner;
    const tokenMint = tokenAccountData.mint;
    const tokenAmount = await provider.connection.getTokenAccountBalance(
      tokenAccountPublicKey
    );

    // Assert token account info has correct values
    assert.ok(provider.wallet.publicKey.toBase58() === tokenOwner);
    assert.ok(mintAccount.publicKey.toBase58() === tokenMint);
    assert.ok(tokenAmount.value.uiAmount === supply.toNumber());

    // Get token using owner and mint
    const tokenByOwnerAndMint =
      await provider.connection.getParsedTokenAccountsByOwner(
        provider.wallet.publicKey,
        { mint: mintAccount.publicKey }
      );
    assert.ok(
      tokenAccountPublicKey.toBase58() ===
        (tokenByOwnerAndMint.value as any)[0].pubkey.toBase58()
    );
  });

  it("Cannot create item account with long item name", async () => {
    const itemAccount = web3.Keypair.generate();
    const name = "X".repeat(50);
    const market = "Fruit";
    const supply = new anchor.BN(200);
    const mintAccount = web3.Keypair.generate();
    const tokenAccountPublicKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      provider.wallet.publicKey
    );

    try {
      await program.rpc.createItemAccount(name, market, supply, {
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
    } catch (error) {
      assert.equal(error.msg, "The item name is too long");
    }
  });

  it("Creates offer and transfers tokens to vault account", async () => {
    // Airdropping tokens to other account
    const otherAccount = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        otherAccount.publicKey,
        10000000000
      ),
      "processed"
    );

    const itemAccount = web3.Keypair.generate();
    const name = "Oranges";
    const market = "Fruit";
    const supply = new anchor.BN(100);
    const mintAccount = web3.Keypair.generate();
    const otherTokenAccountPublicKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      otherAccount.publicKey
    );

    await program.rpc.createItemAccount(name, market, supply, {
      accounts: {
        itemAccount: itemAccount.publicKey,
        mintAccount: mintAccount.publicKey,
        associatedTokenAccount: otherTokenAccountPublicKey,
        user: otherAccount.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [itemAccount, mintAccount, otherAccount],
    });

    const giveAmount = new anchor.BN(20);
    const receiveAmount = new anchor.BN(50);
    const offer = web3.Keypair.generate();
    // const [vaultTokenAccountPublicKey, vaultBump] =
    //   await web3.PublicKey.findProgramAddress(
    //     [offer.publicKey.toBuffer()],
    //     program.programId
    //   );
    const vaultTokenAccount = web3.Keypair.generate();

    await program.rpc.createOffer(giveAmount, receiveAmount, {
      accounts: {
        initializer: otherAccount.publicKey,
        offer: offer.publicKey,
        intializerTokenAccount: otherTokenAccountPublicKey,
        mint: mintAccount.publicKey,
        vaultTokenAccount: vaultTokenAccount.publicKey,
        takerTokenAccount: tokenAccountPublicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [offer, vaultTokenAccount, otherAccount],
    });

    const fetchedOfferAccount = await program.account.offer.fetch(
      offer.publicKey
    );
    assert.ok(fetchedOfferAccount.initializer.equals(otherAccount.publicKey));
    assert.ok(fetchedOfferAccount.receiveAmount.eq(receiveAmount));

    const vaultTokenAmount = await provider.connection.getTokenAccountBalance(
      vaultTokenAccount.publicKey
    );
    assert.ok(vaultTokenAmount.value.uiAmount === giveAmount.toNumber());
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
