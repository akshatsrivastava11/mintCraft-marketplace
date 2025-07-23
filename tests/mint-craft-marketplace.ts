import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MintCraftMarketplace } from "../target/types/mint_craft_marketplace";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

describe("mint-craft-marketplace", () => {
  // Configure the client to use the local cluster.
  const provider=anchor.AnchorProvider.env();  
  anchor.setProvider(provider);
  const program = anchor.workspace.mintCraftMarketplace as Program<MintCraftMarketplace>;
  let authority=Keypair.generate();
  let user=Keypair.generate();
  let userConfig:PublicKey
  let marketplace:PublicKey;
  let listing:PublicKey
  let mint:PublicKey;
  let user_mint_ata:PublicKey;
  let vault_mint:PublicKey;
  const fees=10;
  const price=0.01*LAMPORTS_PER_SOL;
  before(async()=>{
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey,2*LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey,2*LAMPORTS_PER_SOL)
    );
    marketplace=PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    )[0];
    //seeds=[b"user",user.key().as_ref()],

    userConfig=PublicKey.findProgramAddressSync(
      [Buffer.from("user"),user.publicKey.toBuffer()],
      program.programId
    )[0]

    listing=PublicKey.findProgramAddressSync(
      [Buffer.from("listing"),marketplace.toBuffer()],
      program.programId
    )[0];

    mint=await createMint(provider.connection,user,user.publicKey,null,0);
    //makers mint
    user_mint_ata=(await getOrCreateAssociatedTokenAccount(provider.connection,user,mint,user.publicKey,false)).address
    await mintTo(provider.connection,user,mint,user_mint_ata,user.publicKey,1)
    vault_mint=getAssociatedTokenAddressSync(mint,listing,true)


  })
  it("InitializeMarketplace",async()=>{
    await program.methods.initializeMarketplace(fees).accounts({
      authority:authority.publicKey,
      marketplace:marketplace,
      systemProgram:SYSTEM_PROGRAM_ID
    }).signers([authority]).rpc()
  })
  it("initializeUser",async()=>{
    await program.methods.initializeUser().accounts({
      user:user.publicKey,
      userConfig:userConfig,
      systemProgram:SYSTEM_PROGRAM_ID
    }).signers([user]).rpc()
  })
  it("List",async()=>{
    await program.methods.list(new anchor.BN(price)).accounts({
      maker:user.publicKey,
      marketplace:marketplace,
      listing:listing,
      mint:mint,
      user_mint_ata:user_mint_ata,
      vault_mint:vault_mint,
      user_config:userConfig,
      system_program:SYSTEM_PROGRAM_ID,
      token_program:TOKEN_PROGRAM_ID,
      associated_token_program:ASSOCIATED_PROGRAM_ID
    }).signers([user]).rpc()
  })
  it("delist",async()=>{
    await program.methods.delist().accounts({
      maker:user.publicKey,
      markteplace:marketplace,
      listing:listing,
      mint:mint,
      user_mint_ata:user_mint_ata,
      vault_mint:vault_mint,
      user_config:userConfig,
      system_program:SYSTEM_PROGRAM_ID,
      token_program:TOKEN_PROGRAM_ID
    }).signers([user]).rpc()
  })
  
});
  //  #[account(mut)]
  //   pub maker:Signer<'info>,
  //   #[account(
  //       seeds=[b"marketplace"],
  //       bump=marketplace.bump
  //   )]
  //   pub marketplace:Account<'info,Marketplace>,
  //   #[account(
  //       seeds=[b"listing",marketplace.key().as_ref()],
  //       bump
  //   )]
  //   pub listing:Account<'info,Listing>,
  //   pub mint:Account<'info,Mint>,
  //   #[account(
  //       mut,
  //       associated_token::mint=mint,
  //       associated_token::authority=maker
  //   )]
  //   pub user_mint_ata:Account<'info,TokenAccount>,
  //   #[account(
  //       associated_token::mint=mint,
  //       associated_token::authority=listing
  //   )]
  //   pub  vault_mint:Account<'info,TokenAccount>,
  //   #[account(
  //       mut,
  //       seeds=[b"user",maker.key().as_ref()],
  //       bump
  //   )]
  //   pub user_config:Account<'info,UserConfig>,
  //   pub system_program:Program<'info,System>,
  //   pub token_program:Program<'info,Token>