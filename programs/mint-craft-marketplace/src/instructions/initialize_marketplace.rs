use anchor_lang::prelude::*;

use crate::Marketplace;

#[derive(Accounts)]
pub struct InitializeMarketplace<'info>{
    #[account(mut)]
    pub authority:Signer<'info>,
    #[account(
        init,
        payer=authority,
        space=8+Marketplace::INIT_SPACE,
        seeds=[b"marketplace"],
        bump
    )]
    pub marketplace:Account<'info,Marketplace>,
    pub system_program:Program<'info,System>
}

impl <'info>InitializeMarketplace<'info> {
    pub fn initialize_marketplace(&mut self,fees:u16,bumps:initializeGlobalStateBumps)->Result<()>{
        self.marketplace.set_inner(Marketplace {
             authority:self.authority.key(),
              total_listing:0,
               total_sales: 0,
                platform_fees_percent:fees,
                 bump: bumps.global_state
                 });
                 Ok(())
    }
}