import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MintCraftMarketplace } from "../target/types/mint_craft_marketplace";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { createMint, getAccount, getAssociatedTokenAddressSync, getMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_GROUP_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

describe("mint-craft-marketplace", () => {
  // Configure the client to use the local cluster.
  const provider=anchor.AnchorProvider.env();  
  anchor.setProvider(provider);
  const program = anchor.workspace.mintCraftMarketplace as Program<MintCraftMarketplace>;
  let authority=Keypair.generate();
  let user=Keypair.generate();
  let taker=Keypair.generate();
  // console.log("Authority public key ",authority.publicKey)
  // console.log("user public key ",user.publicKey)
  // console.log("taker public key ",taker.publicKey)

  // console.log(taker.publicKey.toBuffer())
  let taker_ata:PublicKey
  let taker_config:PublicKey
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
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(taker.publicKey,2*LAMPORTS_PER_SOL)
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
    taker_config=PublicKey.findProgramAddressSync(
      [Buffer.from("user"),taker.publicKey.toBuffer()],
      program.programId
    )[0]
    
    listing=PublicKey.findProgramAddressSync(
      [Buffer.from("listing"),marketplace.toBuffer()],
      program.programId
    )[0];
    // console.log("Listing is ",listing)
    
    mint=await createMint(provider.connection,user,user.publicKey,null,0);
    //makers mint
    user_mint_ata=(await getOrCreateAssociatedTokenAccount(provider.connection,user,mint,user.publicKey,false)).address
    await mintTo(provider.connection,user,mint,user_mint_ata,user.publicKey,1)
    vault_mint=getAssociatedTokenAddressSync(mint,listing,true)
    
    taker_ata=(await getOrCreateAssociatedTokenAccount(provider.connection,taker,mint,taker.publicKey,false)).address
    // console.log("taker's ata is ",taker_ata)
    // console.log("vault_mint",vault_mint)
    // console.log("user mint ata is ",user_mint_ata)
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
const user_ata=await getAccount(provider.connection,user_mint_ata);
console.log("user mint ata amt is ",user_ata.amount)
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
  // it("delist",async()=>{
  //   // console.log("maker is ",user.publicKey)
  //   // console.log("marketplace",marketplace)
  //   // console.log("listing",listing)
  //   // console.log("mint",mint)
  //   // console.log("user mint ata",user_mint_ata)
  //   // console.log("vault_mint_ata",vault_mint)
  //   // console.log("userconfig",userConfig)


  //   await program.methods.delist().accounts({
  //     maker:user.publicKey,
  //     marketplace:marketplace,
  //     listing:listing,
  //     mint:mint,
  //     user_mint_ata:user_mint_ata,
  //     vault_mint:vault_mint,
  //     user_config:userConfig,
  //     system_program:SYSTEM_PROGRAM_ID,
  //     token_program:TOKEN_PROGRAM_ID

  //   }).signers([user]).rpc()
  // })
  
  it("purchase",async ()=>{
    //     await program.methods.list(new anchor.BN(price)).accounts({
    //   maker:user.publicKey,
    //   marketplace:marketplace,
    //   listing:listing,
    //   mint:mint,
    //   user_mint_ata:user_mint_ata,
    //   vault_mint:vault_mint,
    //   user_config:userConfig,
    //   system_program:SYSTEM_PROGRAM_ID,
    //   token_program:TOKEN_PROGRAM_ID,
    //   associated_token_program:ASSOCIATED_PROGRAM_ID
    // }).signers([user]).rpc()
const user_ata=await getAccount(provider.connection,user_mint_ata);
console.log("user mint ata amt is ",user_ata.amount)

    const mintInfo = await getMint(provider.connection, mint);
console.log(mintInfo.decimals); // should be 0
    vault_mint=(await getOrCreateAssociatedTokenAccount(provider.connection,user,mint,listing,true)).address
    const vault = await getAccount(provider.connection, vault_mint);
    console.log("Vault amount", vault); // s
    await program.methods.initializeUser().accounts({
      user:taker.publicKey,
      userConfig:taker_config,
      systemProgram:SYSTEM_PROGRAM_ID
    }).signers([taker]).rpc()
    await program.methods.purchase().accounts({
      taker:taker.publicKey,
      maker:user.publicKey,
      mint:mint,
      maker_ata:user_mint_ata,
      taker_ata:taker_ata,
      authority:authority.publicKey,
      vault:vault_mint,
      marketplace:marketplace,
      listing:listing,
      maker_config:userConfig,
      taker_config:taker_config,
      system_program:SYSTEM_PROGRAM_ID,
      token_program:TOKEN_PROGRAM_ID,
      associated_token_program:ASSOCIATED_PROGRAM_ID      

    }).signers([taker]).rpc()
  })

});
  // #[account(mut)]
  //   pub taker:Signer<'info>,
  //   pub maker:SystemAccount<'info>,
  //   pub mint:Account<'info,Mint>,
  //   #[account(
  //       mut,
  //       associated_token::authority=maker,
  //       associated_token::mint=mint
  //   )]
  //   pub maker_ata:Account<'info,TokenAccount>,
  //   #[account(
  //       mut,
  //       associated_token::authority=maker,
  //       associated_token::mint=mint
  //   )]
  //   pub taker_ata:Account<'info,TokenAccount>,

  //   pub remaining_accounts:SystemAccount<'info>,
  //   #[account(
  //       mut,
  //       associated_token::authority=listing,
  //       associated_token::mint=mint
  //   )]
  //   pub  vault:Account<'info,TokenAccount>,
  //   #[account(
  //       seeds=[b"marketplace"],
  //       bump
  //   )]    
  //   pub marketplace:Account<'info,Marketplace>,
  //   #[account(
  //       mut,
  //       close=maker,
  //       seeds=[b"listing",marketplace.key().as_ref()],
  //       bump
  //   )]
  //   pub listing:Account<'info,Listing>,
  //   #[account(
  //       mut,
  //       seeds=[b"user",maker.key().as_ref()],
  //       bump
  //   )]
  //   pub maker_config:Account<'info,UserConfig>,
  //   #[account(:
  //       mut,
  //       seeds=[b"user",taker.key().as_ref()],
  //       bump
  //   )]
  //   pub taker_config:Account<'info,UserConfig>,
  //   pub system_program:Program<'info,System>,
  //   pub token_program:Program<'info,Token>,
  //   pub associated_token_program:Program<'info,AssociatedToken>,