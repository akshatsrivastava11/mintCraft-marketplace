use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserConfig{
    pub user:Pubkey,
    pub  total_listed:u64,
    pub total_buyed:u64,   
    pub bump:u8
}