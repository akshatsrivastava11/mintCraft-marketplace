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
  let id=32;
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

    userConfig=PublicKey.findProgramAddressSync(
      [Buffer.from("user"),user.publicKey.toBuffer()],
      program.programId
    )[0]
    
    taker_config=PublicKey.findProgramAddressSync(
      [Buffer.from("user"),taker.publicKey.toBuffer()],
      program.programId
    )[0]
    
    // Fix: Create a proper 4-byte little-endian buffer for the id
    const idBuffer = Buffer.allocUnsafe(4);
    idBuffer.writeUInt32LE(id, 0);
    
    listing=PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), marketplace.toBuffer(), idBuffer, user.publicKey.toBuffer()],
      program.programId
    )[0];
    
    console.log("Listing PDA:", listing.toString());
    
    mint=await createMint(provider.connection,user,user.publicKey,null,0);
    //makers mint
    user_mint_ata=(await getOrCreateAssociatedTokenAccount(provider.connection,user,mint,user.publicKey,false)).address
    await mintTo(provider.connection,user,mint,user_mint_ata,user.publicKey,1)
    vault_mint=getAssociatedTokenAddressSync(mint,listing,true)
    
    taker_ata=(await getOrCreateAssociatedTokenAccount(provider.connection,taker,mint,taker.publicKey,false)).address
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
    
    await program.methods.list(new anchor.BN(price),id).accountsPartial({
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

  // Uncomment and fix other tests as needed
  // it("delist",async()=>{
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
  
  // it("purchase",async ()=>{
  //   const user_ata=await getAccount(provider.connection,user_mint_ata);
  //   console.log("user mint ata amt is ",user_ata.amount)

  //   const mintInfo = await getMint(provider.connection, mint);
  //   console.log(mintInfo.decimals); // should be 0
    
  //   vault_mint=(await getOrCreateAssociatedTokenAccount(provider.connection,user,mint,listing,true)).address
  //   const vault = await getAccount(provider.connection, vault_mint);
  //   console.log("Vault amount", vault);
    
  //   await program.methods.initializeUser().accounts({
  //     user:taker.publicKey,
  //     userConfig:taker_config,
  //     systemProgram:SYSTEM_PROGRAM_ID
  //   }).signers([taker]).rpc()
    
  //   await program.methods.purchase().accounts({
  //     taker:taker.publicKey,
  //     maker:user.publicKey,
  //     mint:mint,
  //     maker_ata:user_mint_ata,
  //     taker_ata:taker_ata,
  //     authority:authority.publicKey,
  //     vault:vault_mint,
  //     marketplace:marketplace,
  //     listing:listing,
  //     maker_config:userConfig,
  //     taker_config:taker_config,
  //     token_program:TOKEN_PROGRAM_ID,
  //     associated_token_program:ASSOCIATED_PROGRAM_ID      
  //   }).signers([taker]).rpc()
  // })
});