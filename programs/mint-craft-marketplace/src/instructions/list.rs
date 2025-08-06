use anchor_lang::{prelude::*, solana_program::secp256k1_recover::SECP256K1_SIGNATURE_LENGTH};
use anchor_spl::{associated_token::AssociatedToken, token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked}};

use crate::{Listing, Marketplace, UserConfig};

#[derive(Accounts)]
#[instruction(price:u64,id:u32)]
pub struct List<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    #[account(
        seeds=[b"marketplace"],
        bump=marketplace.bump
    )]
    pub marketplace:Account<'info,Marketplace>,
    #[account(
        init,
        payer=maker,
        space=8+Listing::INIT_SPACE,
        seeds=[b"listing",marketplace.key().as_ref(),id.to_le_bytes().as_ref(),maker.key().as_ref()],
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
        init_if_needed,
        payer=maker,
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
    pub token_program:Program<'info,Token>,
    pub associated_token_program:Program<'info,AssociatedToken>
}

//create the list
//transfer the nft to the vault
impl <'info>List<'info> {
    pub fn list(&mut self,price:u64,id:u32,bumps:ListBumps)->Result<()>{
        self.create_list(price,id,bumps);
        self.transfer_nft();
        Ok(())
    }
    pub fn create_list(&mut self,price:u64,id:u32,bumps:ListBumps)->Result<()>{
        self.listing.set_inner(Listing { 
            maker: self.maker.key(),
             mint: self.mint.key(),
              price,
               bump:bumps.listing,
               id:id
             });
        Ok(())
    }
    pub fn transfer_nft(&mut self)->Result<()>{
        let program=self.token_program.to_account_info();
        let accounts=TransferChecked{
            authority:self.maker.to_account_info(),
            from:self.user_mint_ata.to_account_info(),
            mint:self.mint.to_account_info(),
            to:self.vault_mint.to_account_info()
        };
        let ctx=CpiContext::new(program, accounts);
        transfer_checked(ctx, 1, 0)?;
        self.user_config.total_listed+=1;
        msg!("amt is {}",self.vault_mint.amount);

        Ok(())
    }
}