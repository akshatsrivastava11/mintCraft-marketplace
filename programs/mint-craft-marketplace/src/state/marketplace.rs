use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Marketplace{
    pub authority:Pubkey,
    pub total_listing:u64,
    pub total_sales:u64,
    pub platform_fees_percent:u16,   
    pub bump:u8
}