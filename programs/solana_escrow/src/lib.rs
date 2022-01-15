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
        // Create Item Account
        let item_account = &mut ctx.accounts.item_account;
        item_account.name = name;
        item_account.market = market;
        item_account.mint_public_key = ctx.accounts.mint_account.key();
        Ok(())
    }
}

// Account
#[account]
pub struct ItemAccount {
    mint_public_key: Pubkey,
    name: String,
    market: String,
}

const DISCRIMINATOR: usize = 8;
const MINT_PUBLIC_KEY: usize = 32;
const VEC_PREFIX: usize = 4;
const POSSIBLE_NUM_OF_CHARS: usize = 50;
const CHAR_SIZE: usize = 8;
const ITEM_NAME: usize = VEC_PREFIX + (POSSIBLE_NUM_OF_CHARS * CHAR_SIZE);
const MARKET_NAME: usize = ITEM_NAME;

impl ItemAccount {
    const LEN: usize = DISCRIMINATOR + MINT_PUBLIC_KEY + ITEM_NAME + MARKET_NAME;
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
