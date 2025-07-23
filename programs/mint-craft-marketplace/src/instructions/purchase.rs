use anchor_lang::{prelude::*, system_program::{Transfer,transfer}};
use anchor_spl::{associated_token::AssociatedToken, token::{ close_account, mint_to, transfer_checked, CloseAccount, Mint, MintTo, Token, TokenAccount, TransferChecked}, token_2022::spl_token_2022::extension::metadata_pointer::processor};

use crate::{marketplace, Listing, Marketplace, UserConfig};

#[derive(Accounts)]
pub struct Purchase<'info>{
    #[account(mut)]
    pub taker:Signer<'info>,
    #[account(mut)]
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
    #[account(mut)]
    pub authority:SystemAccount<'info>,
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
    #[account(
        mut,
        seeds=[b"user",maker.key().as_ref()],
        bump
    )]
    pub maker_config:Account<'info,UserConfig>,
    #[account(
        mut,
        seeds=[b"user",taker.key().as_ref()],
        bump
    )]
    pub taker_config:Account<'info,UserConfig>,
    pub system_program:Program<'info,System>,
    pub token_program:Program<'info,Token>,
    pub associated_token_program:Program<'info,AssociatedToken>,
}
   
//transfer the nft from maker's ata to taker's ata
//close the vault
impl<'info>Purchase<'info>{
    pub fn purchase(&mut self,bumps:PurchaseBumps)->Result<()>{
        self.transfer(bumps);
        self.transferSol();
        self.transferfees();
        Ok(())
    }
    pub fn transfer(&mut self,bumps:PurchaseBumps)->Result<()>{
        msg!("amt is {}",self.vault.amount);
        require!(
    self.vault.amount >= 1,
    ErrorCode::InsufficientVaultBalance
);
        let program=self.token_program.to_account_info();

        let accounts=TransferChecked{
            from:self.vault.to_account_info(),
            to:self.taker_ata.to_account_info(),
            authority:self.listing.to_account_info(),
            mint:self.mint.to_account_info()
        };
        let binding = self.marketplace.key();
        let seeds=&[
            b"listing",binding.as_ref(),
            &[self.listing.bump]
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
        transfer(ctx, self.listing.price);
        self.taker_config.total_buyed+=1;
        self.maker_config.total_listed-=1;
        Ok(())
    }
    pub fn transferfees(&mut self)->Result<()>{
        let program=self.token_program.to_account_info();
        let fees=self.marketplace.platform_fees_percent/10000 * self.listing.price as u16;
        let accounts=Transfer{
            from:self.taker.to_account_info(),
            to:self.authority.to_account_info()
        };
        let ctx=CpiContext::new(program, accounts);
        transfer(ctx, fees as u64);

        Ok(())
    }


}

#[error_code]
pub enum ErrorCode {
    #[msg("Vault does not contain sufficient tokens.")]
    InsufficientVaultBalance,
}
