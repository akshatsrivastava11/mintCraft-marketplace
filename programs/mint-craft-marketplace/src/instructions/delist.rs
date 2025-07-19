use anchor_lang::{accounts::program, prelude::*};
use anchor_spl::token::{close_account, transfer_checked, CloseAccount, TransferChecked};

#[derive(Accounts)]
pub struct Delist<'info>{
     #[account(mut)]
    pub maker:Signer<'info>,
    #[account(
        seeds=[b"marketplace"],
        bump=marketplace.bump
    )]
    pub marketplace:Account<'info,Marketplace>,
    #[account(
        seeds=[b"listing",marketplace.key().as_ref()],
        bump
    )]
    pub listing:Account<'info,Listing>,
    pub mint:Account<'info,Mint>,
    #[account(
        mut,
        associated_token::mint=mint,
        associated_token::authority=maker
    )]
    pub user_mint_ata:Account<'info,TokenAccount>,
    #[account(
        associated_token::mint=mint,
        associated_token::authority=listing
    )]
    pub  vault_mint:Account<'info,TokenAccount>,
    pub system_program:Program<'info,System>,
    pub token_program:Program<'info,Token>
}

//transfer back to the vault
//closing the vault
impl<'info>Delist<'info>{
    pub fn delist(&mut self,bumps:DelistBumps)->Result<()>{
        self.transfer_back(bumps);
        self.close_vault()
    }
    pub fn transfer_back(&mut self,bumps:DelistBumps)->Result<()>{
        let program=self.token_program.to_account_info();
        let accounts=TransferChecked{
            authority:self.listing.to_account_info(),
            from:self.vault_mint.to_account_info(),
            mint:self.mint.to_account_info(),
            to:self.user_mint_ata.to_account_info()
        };
        let seeds=&[
            b"listing",self.marketplace.key().as_ref(),
            &[bumps.listing]
        ];
        let signer_seeds=&[&seeds[..]];
        let ctx=CpiContext::new_with_signer(program, accounts, signer_seeds);
        transfer_checked(ctx, 1, 0);
        Ok(())
    }
    pub fn close_vault(&mut self)->Result<()>{
        let program=self.token_program.to_account_info();
        let seeds=&[
            b"listing",self.marketplace.key().as_ref(),
            &[bumps.listing]
        ];
        let signer_seeds=&[&seeds[..]];
        let account=CloseAccount{
            account:self.vault_mint.to_account_info(),
            authority:self.listing.to_account_info(),
            destination:self.maker.to_account_info()
        };
        close_account(ctx);
        Ok(())
    }
}