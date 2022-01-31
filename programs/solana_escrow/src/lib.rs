use anchor_lang::prelude::*;
use anchor_lang::AccountsClose;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, transfer, Mint, MintTo, Transfer, Token, TokenAccount},
};
declare_id!("mPDsnHtotv9hio1izTtLS5ejPokcRvXGdyYLoWDPezx");

#[program]
pub mod solana_escrow {
    use super::*;

    pub fn create_item_account(
        ctx: Context<CreateItemAccount>,
        name: String,
        market: String,
        supply: u64,
    ) -> ProgramResult {
        // Data validation
        if name.chars().count() > 50 {
            return Err(ErrorCode::ItemNameTooLong.into());
        }
        if market.chars().count() > 50 {
            return Err(ErrorCode::MarketNameTooLong.into());
        }

        // Create Item Account
        let item_account = &mut ctx.accounts.item_account;
        item_account.name = name;
        item_account.market = market;
        item_account.mint_public_key = ctx.accounts.mint_account.key();
        item_account.seller = ctx.accounts.user.key();
        item_account.token_account_public_key = ctx.accounts.associated_token_account.key();

        // Mint to associated token account
        let token_program = ctx.accounts.token_program.to_account_info();
        let mint_to_accounts = MintTo {
            mint: ctx.accounts.mint_account.to_account_info(),
            to: ctx.accounts.associated_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_context = CpiContext::new(token_program, mint_to_accounts);
        mint_to(cpi_context, supply)?;

        Ok(())
    }

    pub fn create_offer(ctx: Context<CreateOffer>, give_amount: u64, receive_amount: u64, _offer_bump: u8, _vault_bump: u8) -> ProgramResult {
        // Set values for Offer account
        let offer = &mut ctx.accounts.offer;
        offer.initializer = ctx.accounts.initializer.key();
        offer.initializer_token_account = ctx.accounts.initializer_token_account.key();
        offer.taker_token_account = ctx.accounts.taker_token_account.key();
        offer.give_amount = give_amount;
        offer.receive_amount = receive_amount;

        // Transfer give amount to vault token account
        let accounts = Transfer {
            from: ctx.accounts.initializer_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.initializer.to_account_info(),
        };
        let token_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(token_program, accounts);
        transfer(cpi_context, give_amount)?;
        Ok(())
    }

    pub fn accept_offer(ctx: Context<AcceptOffer>, taker_give_amount: u64) -> ProgramResult {
        // transfer tokens from taker to initializer
        let transfer_accounts = Transfer {
            from: ctx.accounts.taker_give_token_account.to_account_info(),
            to: ctx.accounts.initializer_receive_token_account.to_account_info(),
            authority: ctx.accounts.taker.to_account_info()
        };
        let token_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(token_program, transfer_accounts);
        transfer(cpi_context, taker_give_amount)?;

        // transfer tokens from vault to taker
        let (_vault_authority, vault_bump) = Pubkey::find_program_address(
            &[
                ctx.accounts.offer.initializer_token_account.key().as_ref(), 
                ctx.accounts.offer.give_amount.to_le_bytes().as_ref(), 
                ctx.accounts.offer.taker_token_account.key().as_ref(), 
                ctx.accounts.offer.receive_amount.to_le_bytes().as_ref()
            ], 
            ctx.program_id
        );
        let vault_transfer_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.taker_receive_token_account.to_account_info(),
            authority: ctx.accounts.offer.to_account_info()
        };
        let token_program = ctx.accounts.token_program.to_account_info();
        transfer(
            CpiContext::new_with_signer(
                token_program, 
                vault_transfer_accounts, 
                &[
                    &[
                        ctx.accounts.offer.initializer_token_account.key().as_ref(), 
                        ctx.accounts.offer.give_amount.to_le_bytes().as_ref(), 
                        ctx.accounts.offer.taker_token_account.key().as_ref(), 
                        ctx.accounts.offer.receive_amount.to_le_bytes().as_ref(),
                        &[vault_bump]
                    ]
                ]
            ), 
            ctx.accounts.offer.give_amount
        )?;

        // close offer account and send rent to initializer
        ctx.accounts.offer.close(ctx.accounts.initializer.to_account_info())?;
        
        Ok(())
    }
}

// Item Account
#[account]
pub struct ItemAccount {
    mint_public_key: Pubkey,
    token_account_public_key: Pubkey,
    name: String,
    market: String,
    seller: Pubkey,
}

const DISCRIMINATOR: usize = 8;
const MINT_PUBLIC_KEY: usize = 32;
const TOKEN_ACCOUNT_PUBLIC_KEY: usize = 32;
const VEC_PREFIX: usize = 4;
const POSSIBLE_NUM_OF_CHARS: usize = 50;
const CHAR_SIZE: usize = 8;
const ITEM_NAME: usize = VEC_PREFIX + (POSSIBLE_NUM_OF_CHARS * CHAR_SIZE);
const MARKET_NAME: usize = ITEM_NAME;
const SELLER_PUBLIC_KEY: usize = 32;

impl ItemAccount {
    const LEN: usize = DISCRIMINATOR
        + MINT_PUBLIC_KEY
        + TOKEN_ACCOUNT_PUBLIC_KEY
        + ITEM_NAME
        + MARKET_NAME
        + SELLER_PUBLIC_KEY;
}

// Offer Account
#[account]
pub struct Offer {
    initializer: Pubkey,
    initializer_token_account: Pubkey,
    taker_token_account: Pubkey,
    give_amount: u64,
    receive_amount: u64,
}

const INITIALIZER_PUBLIC_KEY: usize = 32;
const INITIALIZER_TOKEN_ACCOUNT: usize = 32;
const TAKER_TOKEN_ACCOUNT: usize = 32;
const GIVE_AMOUNT: usize = 8;
const RECEIVE_AMOUNT: usize = 8;

impl Offer {
    const LEN: usize = DISCRIMINATOR 
        + INITIALIZER_PUBLIC_KEY 
        + INITIALIZER_TOKEN_ACCOUNT 
        + TAKER_TOKEN_ACCOUNT 
        + GIVE_AMOUNT 
        + RECEIVE_AMOUNT;
}

// Instruction: Create Item
#[derive(Accounts)]
pub struct CreateItemAccount<'info> {
    #[account(init, payer = user, space = ItemAccount::LEN)]
    pub item_account: Account<'info, ItemAccount>,
    #[account(init, payer = user, mint::decimals = 0, mint::authority = user)]
    pub mint_account: Account<'info, Mint>,
    #[account(init, payer = user, associated_token::mint = mint_account, associated_token::authority = user)]
    pub associated_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// Instruction: CreateOffer
#[derive(Accounts)]
#[instruction(give_amount: u64, receive_amount: u64, offer_bump: u8, vault_bump: u8)]
pub struct CreateOffer<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        init, 
        seeds = [
            initializer_token_account.key().as_ref(), 
            give_amount.to_le_bytes().as_ref(), 
            taker_token_account.key().as_ref(), 
            receive_amount.to_le_bytes().as_ref()
        ], 
        bump = offer_bump, 
        payer = initializer, 
        space = Offer::LEN
    )]
    pub offer: Account<'info, Offer>,
    #[account(mut, constraint = initializer_token_account.owner == initializer.key())]
    pub initializer_token_account: Account<'info, TokenAccount>,
    #[account(constraint = initializer_token_account.mint == mint.key())]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        seeds = [
            initializer_token_account.key().as_ref(), 
            taker_token_account.key().as_ref()
        ],
        bump = vault_bump,
        payer = initializer, 
        token::mint = mint,
        token::authority = offer
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub taker_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

// Instruction: Accept Offer
#[derive(Accounts)]
#[instruction(taker_give_amount: u64)]
pub struct AcceptOffer<'info> {
    #[account(
        mut,
        constraint = 
            offer.initializer == initializer.key() &&
            offer.taker_token_account == taker_give_token_account.key() &&
            offer.give_amount == vault_token_account.amount &&
            offer.receive_amount == taker_give_amount
    )]
    pub offer: Box<Account<'info, Offer>>,
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub initializer: SystemAccount<'info>,
    #[account(mut)]
    pub taker_give_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed, 
        payer = taker, 
        associated_token::mint = initializer_mint, 
        associated_token::authority = taker
    )]
    pub taker_receive_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed, 
        payer = taker, 
        associated_token::mint = taker_mint, 
        associated_token::authority = initializer
    )]
    pub initializer_receive_token_account: Account<'info, TokenAccount>,
    pub taker_mint: Box<Account<'info, Mint>>,
    pub initializer_mint: Box<Account<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// Errors
#[error]
pub enum ErrorCode {
    #[msg("The item name is too long")]
    ItemNameTooLong,
    #[msg("The market name is too long")]
    MarketNameTooLong,
}
