use anchor_lang::prelude::*;

declare_id!("GXwRXoHCS1LPZMka3rB4jPgtU9wXVmSnJWumG7DxdiyF");

#[program]
pub mod solana_escrow {
    use super::*;

    pub fn create_item_account(
        ctx: Context<CreateItemAccount>,
        mint_public_key: Pubkey,
        name: String,
        market: String,
    ) -> ProgramResult {
        ctx.accounts.item_account.mint_public_key = mint_public_key;
        ctx.accounts.item_account.name = name;
        ctx.accounts.item_account.market = market;
        Ok(())
    }
}

// Instruction
#[derive(Accounts)]
pub struct CreateItemAccount<'info> {
    #[account(init, payer = user, space = ItemAccount::LEN)]
    pub item_account: Account<'info, ItemAccount>,
    #[account(mut)]
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
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
