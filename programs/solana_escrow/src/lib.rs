use anchor_lang::prelude::*;

declare_id!("GXwRXoHCS1LPZMka3rB4jPgtU9wXVmSnJWumG7DxdiyF");

#[program]
pub mod solana_escrow {
    use super::*;

    pub fn create_bio_account(ctx: Context<CreateBioAccount>, name: String) -> ProgramResult {
        ctx.accounts.bio_account.name = name;
        Ok(())
    }

    pub fn update_name(ctx: Context<UpdateName>, name: String) -> ProgramResult {
        ctx.accounts.bio_account.name = name;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateBioAccount<'info> {
    #[account(init, payer = user, space = BioAccount::LEN)]
    pub bio_account: Account<'info, BioAccount>,
    #[account(mut)]
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BioAccount {
    name: String,
}

const PUBLIC_KEY: usize = 32;
const VEC_PREFIX: usize = 4;
const POSSIBLE_NUM_OF_CHARS: usize = 140;
const CHAR_SIZE: usize = 8;
const BIO_NAME: usize = VEC_PREFIX + (POSSIBLE_NUM_OF_CHARS * CHAR_SIZE);

impl BioAccount {
    const LEN: usize = PUBLIC_KEY + BIO_NAME;
}

#[derive(Accounts)]
pub struct UpdateName<'info> {
    #[account(mut)]
    pub bio_account: Account<'info, BioAccount>,
}
