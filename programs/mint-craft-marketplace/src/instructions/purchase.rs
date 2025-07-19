use anchor_lang::{prelude::*, system_program::{Transfer,transfer}};
use anchor_spl::{associated_token::AssociatedToken, token::{ close_account, mint_to, transfer_checked, CloseAccount, Mint, MintTo, Token, TokenAccount, TransferChecked}, token_2022::spl_token_2022::extension::metadata_pointer::processor};

use crate::{marketplace, Listing, Marketplace};

#[derive(Accounts)]
pub struct Purchase<'info>{
    #[account(mut)]
    pub taker:Signer<'info>,
    pub maker:SystemAccount<'info>,
    pub mint:Account<'info,Mint>,
    #[account(
        mut,
        associated_token::authority=maker,
        associated_token::mint=mint
    )]
    pub maker_ata:Account<'info,TokenAccount>,
    #[account(
        mut,
        associated_token::authority=maker,
        associated_token::mint=mint
    )]
    pub taker_ata:Account<'info,TokenAccount>,
    #[account(
        mut,
        associated_token::authority=listing,
        associated_token::mint=mint
    )]
    pub  vault:Account<'info,TokenAccount>,
    #[account(
        seeds=[b"marketplace"],
        bump
    )]    
    pub marketplace:Account<'info,Marketplace>,
    #[account(
        mut,
        close=maker,
        seeds=[b"listing",marketplace.key().as_ref()],
        bump
    )]
    pub listing:Account<'info,Listing>,
    pub system_program:Program<'info,System>,
    pub token_program:Program<'info,Token>,
    pub associated_token_program:Program<'info,AssociatedToken>,
}
   
//transfer the nft from maker's ata to taker's ata
//close the vault
impl<'info>Purchase<'info>{
    pub fn purchase(&mut self)->Result<()>{
        Ok(())
    }
    pub fn transfer(&mut self)->Result<()>{
        let program=self.token_program.to_account_info();
        let accounts=TransferChecked{
            from:self.vault.to_account_info(),
            to:self.taker_ata.to_account_info(),
            authority:self.listing.to_account_info(),
            mint:self.mint.to_account_info()
        };
        let seeds=&[
            b"listing",self.marketplace.key().as_ref(),
            &[bumps.listing]
        ];
        let signer_seeds=&[&seeds[..]];
        let ctx=CpiContext::new_with_signer(program, accounts, signer_seeds);
        transfer_checked(ctx, 1, 0)
    }
    pub fn transferSol(&mut self)->Result<()>{

        let program=self.token_program.to_account_info();
        let accounts=Transfer{
            from:self.taker.to_account_info(),
            to:self.maker.to_account_info()
        };
        let ctx=CpiContext::new(program, accounts);
        transfer(ctx, self.listing.price)
    }
    pub fn transferfees(&mut self)->Result<()>{
        let fees=self.marketplace.platform_fees_percent/10000 * self.listing.price as u16;
        let accounts=Transfer{
            from:self.taker.to_account_info(),
            to:AccountInfo(self.marketplace.authority)
        };
        let ctx=CpiContext::new(program, accounts);
        transfer(ctx, fees as u64);

        Ok(())
    }


}