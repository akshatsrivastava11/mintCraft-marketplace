use anchor_lang::{accounts::program, prelude::*};
use anchor_spl::token::{close_account, transfer_checked, CloseAccount, Mint, Token, TokenAccount, TransferChecked};

use crate::{Listing, Marketplace, UserConfig};

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
        mut,
        seeds=[b"listing",marketplace.key().as_ref(),listing.id.to_le_bytes().as_ref(),maker.key().as_ref()],
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
        mut,
        associated_token::mint=mint,
        associated_token::authority=listing
    )]
    pub  vault_mint:Account<'info,TokenAccount>,
    #[account(
        mut,
        seeds=[b"user",maker.key().as_ref()],
        bump
    )]
    pub user_config:Account<'info,UserConfig>,
    pub system_program:Program<'info,System>,
    pub token_program:Program<'info,Token>
}

//transfer back to the vault
//closing the vault
impl<'info>Delist<'info>{
    pub fn delist(&mut self,bumps:DelistBumps)->Result<()>{
        self.transfer_back(&bumps)?;
        self.close_vault(&bumps)?;
        Ok(())
    }
    pub fn transfer_back(&mut self,bumps:&DelistBumps)->Result<()>{
        let program=self.token_program.to_account_info();
        let accounts=TransferChecked{
            authority:self.listing.to_account_info(),
            from:self.vault_mint.to_account_info(),
            mint:self.mint.to_account_info(),
            to:self.user_mint_ata.to_account_info()
        };
        let binding = self.marketplace.key();
        let binding2=self.maker.key();
        let binding3=self.listing.id.to_le_bytes();
        let seeds=&[
            b"listing",binding.as_ref(),binding3.as_ref(),binding2.as_ref(),
            &[self.listing.bump]
        ];
        let signer_seeds=&[&seeds[..]];
        let ctx=CpiContext::new_with_signer(program, accounts, signer_seeds);
        transfer_checked(ctx, 1, 0);
        self.user_config.total_listed-=1;
        Ok(())
    }
    pub fn close_vault(&mut self,bumps:&DelistBumps)->Result<()>{
        let program=self.token_program.to_account_info();
         let binding = self.marketplace.key();
        let binding2=self.maker.key();
        let binding3=self.listing.id.to_le_bytes();
        let seeds=&[
            b"listing",binding.as_ref(),binding3.as_ref(),binding2.as_ref(),
            &[self.listing.bump]
        ];
        let signer_seeds=&[&seeds[..]];
        let account=CloseAccount{
            account:self.vault_mint.to_account_info(),
            authority:self.listing.to_account_info(),
            destination:self.maker.to_account_info()
        };
        let ctx=CpiContext::new_with_signer(program, account,signer_seeds);
        close_account(ctx);
        Ok(())
    }
}