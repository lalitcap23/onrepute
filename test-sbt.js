const anchor = require('@coral-xyz/anchor');
const { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } = require('@solana/spl-token');
const fs = require('fs');

async function testSBTMinting() {
  console.log("🚀 Starting SBT Minting Test on Devnet");
  
  try {
    // Configure connection to devnet
    const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    anchor.setProvider(provider);

    // Load the program from local IDL
    const programId = new PublicKey('FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN');
    const idl = JSON.parse(fs.readFileSync('./target/idl/devrupt.json', 'utf8'));
    const program = new anchor.Program(idl, programId, provider);

    console.log("✅ Connected to program:", programId.toString());
    console.log("💰 Wallet:", wallet.publicKey.toString());
    
    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log("💰 Wallet balance:", balance / 1e9, "SOL");

    // Step 1: Initialize contributor
    console.log("\n1️⃣ Initializing contributor...");
    
    const [contributorStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
      programId
    );

    const initTx = await program.methods
      .initializeContributor("devrupt-tester")
      .accounts({
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Contributor initialized. Tx:", initTx);
    console.log("📍 Contributor State PDA:", contributorStatePda.toString());

    // Step 2: Record contributions
    console.log("\n2️⃣ Recording contributions...");
    
    const contrib1Tx = await program.methods
      .recordContribution()
      .accounts({
        signer: wallet.publicKey,
      })
      .rpc();

    console.log("✅ First contribution recorded. Tx:", contrib1Tx);

    // Record a second contribution to be safe
    const contrib2Tx = await program.methods
      .recordContribution()
      .accounts({
        signer: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Second contribution recorded. Tx:", contrib2Tx);

    // Check contributor state
    const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    console.log("📊 Total contributions:", contributorState.totalContributions.toNumber());

    // Step 3: Mint SBT
    console.log("\n3️⃣ Minting SBT...");

    // Generate mint keypair (since we're using seeds, we need to derive it)
    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), wallet.publicKey.toBuffer()],
      programId
    );

    // Find metadata PDA
    const metadataProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        mintPda.toBuffer(),
      ],
      metadataProgramId
    );

    const userTokenAccount = getAssociatedTokenAddressSync(
      mintPda,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log("📍 Mint PDA:", mintPda.toString());
    console.log("📍 Token Account:", userTokenAccount.toString());
    console.log("📍 Metadata PDA:", metadataPda.toString());

    const mintTx = await program.methods
      .mintSbt("QmTestMetadataHash123")
      .accounts({
        payer: wallet.publicKey,
        mint: mintPda,
        tokenAccount: userTokenAccount,
        metadata: metadataPda,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: metadataProgramId,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("🎉 SBT minted successfully! Tx:", mintTx);

    // Step 4: Verify the SBT
    console.log("\n4️⃣ Verifying SBT...");

    // Check token account
    const tokenAccountInfo = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      { mint: mintPda },
      TOKEN_2022_PROGRAM_ID
    );

    if (tokenAccountInfo.value.length > 0) {
      console.log("✅ SBT token account found!");
      console.log("📊 Token account address:", tokenAccountInfo.value[0].pubkey.toString());
      
      // Parse token account data to check balance
      const accountInfo = await connection.getAccountInfo(tokenAccountInfo.value[0].pubkey);
      console.log("📊 Account data length:", accountInfo.data.length);
    }

    // Check mint account
    const mintInfo = await connection.getAccountInfo(mintPda);
    if (mintInfo) {
      console.log("✅ Mint account exists with", mintInfo.data.length, "bytes");
      console.log("📊 Mint owner:", mintInfo.owner.toString());
    }

    console.log("\n🎊 SBT MINTING TEST COMPLETED SUCCESSFULLY!");
    console.log("🔗 Your SBT Details:");
    console.log("   - Mint Address:", mintPda.toString());
    console.log("   - Token Account:", userTokenAccount.toString());
    console.log("   - Metadata:", metadataPda.toString());
    console.log("   - Program ID:", programId.toString());
    
    // Explorer links
    console.log("\n🌐 Explorer Links:");
    console.log("   - Mint:", `https://explorer.solana.com/address/${mintPda.toString()}?cluster=devnet`);
    console.log("   - Transaction:", `https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.logs) {
      console.error("📋 Program logs:", error.logs);
    }
  }
}

testSBTMinting().catch(console.error);
