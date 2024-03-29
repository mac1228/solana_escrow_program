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
  let otherTokenAccountPublicKey: web3.PublicKey;
  let offer: anchor.web3.PublicKey;
  let offerBump: number;

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
    otherTokenAccountPublicKey = await Token.getAssociatedTokenAddress(
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

    [offer, offerBump] = await web3.PublicKey.findProgramAddress(
      [
        otherTokenAccountPublicKey.toBuffer(),
        giveAmount.toBuffer("le", 8),
        tokenAccountPublicKey.toBuffer(),
        receiveAmount.toBuffer("le", 8),
      ],
      program.programId
    );
    const [vault, vaultBump] = await web3.PublicKey.findProgramAddress(
      [otherTokenAccountPublicKey.toBuffer(), tokenAccountPublicKey.toBuffer()],
      program.programId
    );

    await program.rpc.createOffer(
      giveAmount,
      receiveAmount,
      offerBump,
      vaultBump,
      {
        accounts: {
          initializer: otherAccount.publicKey,
          offer: offer,
          initializerTokenAccount: otherTokenAccountPublicKey,
          mint: mintAccount.publicKey,
          vaultTokenAccount: vault,
          takerTokenAccount: tokenAccountPublicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [otherAccount],
      }
    );

    const fetchedOfferAccount = await program.account.offer.fetch(offer);
    assert.ok(fetchedOfferAccount.initializer.equals(otherAccount.publicKey));
    assert.ok(fetchedOfferAccount.receiveAmount.eq(receiveAmount));

    const vaultTokenAmount = await provider.connection.getTokenAccountBalance(
      vault
    );
    assert.ok(vaultTokenAmount.value.uiAmount === giveAmount.toNumber());
  });

  it("Accepts offer", async () => {
    const fetchedOfferAccount = await program.account.offer.fetch(offer);
    const giveAmount = fetchedOfferAccount.receiveAmount;
    const [vault, _vaultBump] = await web3.PublicKey.findProgramAddress(
      [
        fetchedOfferAccount.initializerTokenAccount.toBuffer(),
        fetchedOfferAccount.takerTokenAccount.toBuffer(),
      ],
      program.programId
    );

    // Get associated token account for taker to receive tokens
    const initializerTokenAccountInfo =
      await provider.connection.getParsedAccountInfo(
        fetchedOfferAccount.initializerTokenAccount
      );
    const initializerMintBase58: string = (
      initializerTokenAccountInfo.value.data as any
    ).parsed.info.mint;
    const initializerMintPublicKey = new web3.PublicKey(initializerMintBase58);
    const takerReceiveTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      initializerMintPublicKey,
      provider.wallet.publicKey
    );

    // Get associated token account for taker to receive tokens
    const takerTokenAccountInfo =
      await provider.connection.getParsedAccountInfo(
        fetchedOfferAccount.takerTokenAccount
      );
    const takerMintBase58: string = (takerTokenAccountInfo.value.data as any)
      .parsed.info.mint;
    const takerMintPublicKey = new web3.PublicKey(takerMintBase58);

    const initializerReceiveTokenAccount =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        takerMintPublicKey,
        fetchedOfferAccount.initializer
      );

    await program.rpc.acceptOffer(giveAmount, {
      accounts: {
        offer,
        taker: provider.wallet.publicKey,
        initializer: fetchedOfferAccount.initializer,
        takerGiveTokenAccount: fetchedOfferAccount.takerTokenAccount,
        vaultTokenAccount: vault,
        takerReceiveTokenAccount,
        initializerReceiveTokenAccount,
        takerMint: takerMintPublicKey,
        initializerMint: initializerMintPublicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [],
    });

    const fetchedTakerReceiveTokenAccount =
      await provider.connection.getParsedAccountInfo(takerReceiveTokenAccount);
    const takerReceiveTokenAccountAmount = (
      fetchedTakerReceiveTokenAccount.value.data as any
    ).parsed.info.tokenAmount.uiAmount;
    assert.ok(takerReceiveTokenAccountAmount === 20);

    const fetchedInitializerReceiveTokenAccount =
      await provider.connection.getParsedAccountInfo(
        initializerReceiveTokenAccount
      );
    const initializerReceiveTokenAccountAmount = (
      fetchedInitializerReceiveTokenAccount.value.data as any
    ).parsed.info.tokenAmount.uiAmount;
    assert.ok(initializerReceiveTokenAccountAmount === 50);
  });

  it("Cancels offer", async () => {
    // Create Item
    const itemAccount = web3.Keypair.generate();
    const name = "Xbox";
    const market = "Consoles";
    const supply = new anchor.BN(400);
    const mintAccount = web3.Keypair.generate();
    const associatedTokenAccountPublicKey =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintAccount.publicKey,
        provider.wallet.publicKey
      );

    await program.rpc.createItemAccount(name, market, supply, {
      accounts: {
        itemAccount: itemAccount.publicKey,
        mintAccount: mintAccount.publicKey,
        associatedTokenAccount: associatedTokenAccountPublicKey,
        user: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [itemAccount, mintAccount],
    });

    // Get token balance
    let tokenBalance = await provider.connection.getTokenAccountBalance(
      associatedTokenAccountPublicKey
    );
    assert.ok(tokenBalance.value.uiAmount === 400);

    // Create Offer
    const giveAmount = new anchor.BN(20);
    const receiveAmount = new anchor.BN(50);

    [offer, offerBump] = await web3.PublicKey.findProgramAddress(
      [
        associatedTokenAccountPublicKey.toBuffer(),
        giveAmount.toBuffer("le", 8),
        otherTokenAccountPublicKey.toBuffer(),
        receiveAmount.toBuffer("le", 8),
      ],
      program.programId
    );
    const [vault, vaultBump] = await web3.PublicKey.findProgramAddress(
      [
        associatedTokenAccountPublicKey.toBuffer(),
        otherTokenAccountPublicKey.toBuffer(),
      ],
      program.programId
    );

    await program.rpc.createOffer(
      giveAmount,
      receiveAmount,
      offerBump,
      vaultBump,
      {
        accounts: {
          initializer: provider.wallet.publicKey,
          offer: offer,
          initializerTokenAccount: associatedTokenAccountPublicKey,
          mint: mintAccount.publicKey,
          vaultTokenAccount: vault,
          takerTokenAccount: otherTokenAccountPublicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [],
      }
    );

    // Get token balance
    tokenBalance = await provider.connection.getTokenAccountBalance(
      associatedTokenAccountPublicKey
    );
    assert.ok(tokenBalance.value.uiAmount === 380);

    // Cancel Offer
    await program.rpc.cancelOffer({
      accounts: {
        offer,
        initializer: provider.wallet.publicKey,
        initializerTokenAccount: associatedTokenAccountPublicKey,
        vaultTokenAccount: vault,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [],
    });

    // Get token balance
    tokenBalance = await provider.connection.getTokenAccountBalance(
      associatedTokenAccountPublicKey
    );
    assert.ok(tokenBalance.value.uiAmount === 400);
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
