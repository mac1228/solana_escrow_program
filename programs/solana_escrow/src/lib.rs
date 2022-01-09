use anchor_lang::prelude::*;

declare_id!("GXwRXoHCS1LPZMka3rB4jPgtU9wXVmSnJWumG7DxdiyF");

#[program]
pub mod solana_escrow {
    use super::*;

    pub fn create_blah_account(ctx: Context<CreateBlahAccount>, amount: u64) -> ProgramResult {
        ctx.accounts.blah_account.data = amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateBlahAccount<'info> {
    #[account(init, payer = user, space = 16)]
    pub blah_account: Account<'info, BlahAccount>,
    #[account(mut)]
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BlahAccount {
    data: u64,
}
