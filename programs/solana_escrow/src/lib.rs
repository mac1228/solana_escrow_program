use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

declare_id!("mPDsnHtotv9hio1izTtLS5ejPokcRvXGdyYLoWDPezx");

#[program]
pub mod solana_escrow {
    use super::*;

    pub fn create_item_account(
        ctx: Context<CreateItemAccount>,
        name: String,
        market: String,
    ) -> ProgramResult {
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
        Ok(())
    }
}

// Account
#[account]
pub struct ItemAccount {
    mint_public_key: Pubkey,
    name: String,
    market: String,
    seller: Pubkey,
}

const DISCRIMINATOR: usize = 8;
const MINT_PUBLIC_KEY: usize = 32;
const VEC_PREFIX: usize = 4;
const POSSIBLE_NUM_OF_CHARS: usize = 50;
const CHAR_SIZE: usize = 8;
const ITEM_NAME: usize = VEC_PREFIX + (POSSIBLE_NUM_OF_CHARS * CHAR_SIZE);
const MARKET_NAME: usize = ITEM_NAME;
const SELLER_PUBLIC_KEY: usize = 32;

impl ItemAccount {
    const LEN: usize =
        DISCRIMINATOR + MINT_PUBLIC_KEY + ITEM_NAME + MARKET_NAME + SELLER_PUBLIC_KEY;
}

// Instruction
#[derive(Accounts)]
pub struct CreateItemAccount<'info> {
    #[account(init, payer = user, space = ItemAccount::LEN)]
    pub item_account: Account<'info, ItemAccount>,
    pub mint_account: Account<'info, Mint>,
    #[account(mut)]
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Errors
#[error]
pub enum ErrorCode {
    #[msg("The item name is too long")]
    ItemNameTooLong,
    #[msg("The market name is too long")]
    MarketNameTooLong,
}
