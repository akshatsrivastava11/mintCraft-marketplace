pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("3yd3A95e8W6wsNaHe62F9W9oqeNLdhHwfgJohj11pdYj");

#[program]
pub mod mint_craft_marketplace {
    use super::*;

  pub fn initialize_marketplace(ctx:Context<InitializeMarketplace>,fees:u16)->Result<()>{
    ctx.accounts.initialize_marketplace(fees, ctx.bumps)
  }
  pub fn initialize_user(ctx:Context<InitializeUser>)->Result<()>{
    ctx.accounts.initialize_user(ctx.bumps)
  }
  pub fn list(ctx:Context<List>,price:u64)->Result<()>{
    ctx.accounts.list(price, ctx.bumps)
  }
  pub fn delist(ctx:Context<Delist>)->Result<()>{
    ctx.accounts.delist(ctx.bumps)
  }
  pub fn purchase(ctx:Context<Purchase>)->Result<()>{
    ctx.accounts.purchase(ctx.bumps)
  }
}
