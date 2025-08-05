const anchor = require('@coral-xyz/anchor');
const { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } = require('@solana/spl-token');
const fs = require('fs');

async function manualTestWithExplorer() {
  console.log("🧪 Manual SBT Testing with Explorer Tracking");
  console.log("=============================================");
  
  try {
    // Setup
    const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    anchor.setProvider(provider);

    const programId = new PublicKey('FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN');
    const idl = JSON.parse(fs.readFileSync('./target/idl/devrupt.json', 'utf8'));
    const program = new anchor.Program(idl, programId, provider);

    console.log("✅ Connected to program");
    console.log("💰 Wallet:", wallet.publicKey.toString());
    console.log("🌐 Explorer Base:", "https://explorer.solana.com");
    console.log("");

    // Test 1: Initialize Contributor
    console.log("📋 TEST 1: Initialize Contributor");
    console.log("==================================");
    
    const [contributorStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
      programId
    );

    console.log("📍 Contributor State PDA:", contributorStatePda.toString());
    console.log("🌐 View PDA: https://explorer.solana.com/address/" + contributorStatePda.toString() + "?cluster=devnet");

    try {
      console.log("⏳ Sending initialize_contributor transaction...");
      const initTx = await program.methods
        .initializeContributor("manual-tester")
        .accounts({
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ SUCCESS! Transaction:", initTx);
      console.log("🌐 View Transaction: https://explorer.solana.com/tx/" + initTx + "?cluster=devnet");
      console.log("");

      // Wait and check state
      await new Promise(resolve => setTimeout(resolve, 3000));
      const contributorState = await program.account.contributorState.fetch(contributorStatePda);
      console.log("📊 Contributor State:");
      console.log("   - Wallet:", contributorState.wallet.toString());
      console.log("   - Username:", contributorState.githubUsername);
      console.log("   - Contributions:", contributorState.totalContributions.toNumber());
      console.log("   - Rewards:", contributorState.totalRewards.toNumber());

    } catch (error) {
      if (error.message.includes("already in use")) {
        console.log("ℹ️ Contributor already initialized");
        const contributorState = await program.account.contributorState.fetch(contributorStatePda);
        console.log("📊 Current State:");
        console.log("   - Contributions:", contributorState.totalContributions.toNumber());
        console.log("   - Rewards:", contributorState.totalRewards.toNumber());
      } else {
        console.log("❌ Error:", error.message);
        return;
      }
    }

    console.log("");

    // Test 2: Record Contribution
    console.log("📋 TEST 2: Record Contribution");
    console.log("===============================");

    try {
      console.log("⏳ Sending record_contribution transaction...");
      const contribTx = await program.methods
        .recordContribution()
        .accounts({
          signer: wallet.publicKey,
        })
        .rpc();

      console.log("✅ SUCCESS! Transaction:", contribTx);
      console.log("🌐 View Transaction: https://explorer.solana.com/tx/" + contribTx + "?cluster=devnet");

      // Check updated state
      await new Promise(resolve => setTimeout(resolve, 3000));
      const updatedState = await program.account.contributorState.fetch(contributorStatePda);
      console.log("📊 Updated Contributions:", updatedState.totalContributions.toNumber());

    } catch (error) {
      console.log("❌ Error recording contribution:", error.message);
    }

    console.log("");

    // Test 3: Mint SBT
    console.log("📋 TEST 3: Mint SBT");
    console.log("====================");

    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), wallet.publicKey.toBuffer()],
      programId
    );

    const metadataProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), metadataProgramId.toBuffer(), mintPda.toBuffer()],
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
    console.log("🌐 View Mint: https://explorer.solana.com/address/" + mintPda.toString() + "?cluster=devnet");

    try {
      console.log("⏳ Sending mint_sbt transaction...");
      const mintTx = await program.methods
        .mintSbt("QmTestSBTMetadata123")
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

      console.log("🎉 SUCCESS! SBT MINTED!");
      console.log("📝 Transaction:", mintTx);
      console.log("🌐 View Transaction: https://explorer.solana.com/tx/" + mintTx + "?cluster=devnet");
      console.log("");

      console.log("🎊 YOUR SBT DETAILS:");
      console.log("==================");
      console.log("🔗 Mint Address:", mintPda.toString());
      console.log("🔗 Token Account:", userTokenAccount.toString());
      console.log("🔗 Metadata:", metadataPda.toString());
      console.log("");
      console.log("🌐 EXPLORER LINKS:");
      console.log("- Mint: https://explorer.solana.com/address/" + mintPda.toString() + "?cluster=devnet");
      console.log("- Token Account: https://explorer.solana.com/address/" + userTokenAccount.toString() + "?cluster=devnet");
      console.log("- Transaction: https://explorer.solana.com/tx/" + mintTx + "?cluster=devnet");

    } catch (error) {
      console.log("❌ Error minting SBT:", error.message);
      if (error.logs) {
        console.log("📋 Program logs:", error.logs);
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

manualTestWithExplorer().catch(console.error);
