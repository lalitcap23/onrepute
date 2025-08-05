import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Devrupt } from "../target/types/devrupt";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY 
} from "@solana/web3.js";
import { 
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { expect } from "chai";

describe("devrupt", () => {
  // Configure the client to use the devnet cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.devrupt as Program<Devrupt>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as anchor.Wallet;

  it("Complete SBT Flow: Initialize → Contribute → Mint SBT", async () => {
    console.log("🚀 Starting complete SBT minting flow...");
    console.log("💰 Wallet:", wallet.publicKey.toString());

    // Step 1: Initialize contributor
    console.log("1️⃣ Initializing contributor...");
    
    const [contributorStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      const initTx = await program.methods
        .initializeContributor("devrupt-tester")
        .accounts({
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Contributor initialized. Tx:", initTx);
    } catch (error) {
      if (error.message.includes("already in use")) {
        console.log("ℹ️ Contributor already initialized, continuing...");
      } else {
        throw error;
      }
    }

    // Verify contributor state
    const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    console.log("📊 Current contributions:", contributorState.totalContributions.toNumber());

    // Step 2: Record contributions (only if we need more)
    if (contributorState.totalContributions.toNumber() < 1) {
      console.log("2️⃣ Recording contributions...");
      
      const contrib1Tx = await program.methods
        .recordContribution()
        .accounts({
          signer: wallet.publicKey,
        })
        .rpc();

      console.log("✅ Contribution recorded. Tx:", contrib1Tx);
    } else {
      console.log("2️⃣ Sufficient contributions already recorded");
    }

    // Step 3: Mint SBT
    console.log("3️⃣ Minting SBT...");

    // Find mint PDA
    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // Find metadata PDA for Metaplex
    const metadataProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        mintPda.toBuffer(),
      ],
      metadataProgramId
    );

    // Get associated token account
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
      .mintSbt("QmYourSBTMetadataHash123")
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
    console.log("4️⃣ Verifying SBT...");
    
    // Check token account
    const tokenAccountInfo = await provider.connection.getTokenAccountsByOwner(
      wallet.publicKey,
      { mint: mintPda },
      { commitment: "confirmed" }
    );

    expect(tokenAccountInfo.value.length).to.be.greaterThan(0);
    console.log("✅ SBT token account found!");

    // Check mint account
    const mintInfo = await provider.connection.getAccountInfo(mintPda);
    expect(mintInfo).to.not.be.null;
    console.log("✅ Mint account exists");

    console.log("🎊 Complete flow successful!");
    console.log(`🔗 Your SBT Details:`);
    console.log(`   Mint: ${mintPda.toString()}`);
    console.log(`   Token Account: ${userTokenAccount.toString()}`);
    console.log(`   Explorer: https://explorer.solana.com/address/${mintPda.toString()}?cluster=devnet`);
    console.log(`   Transaction: https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);
  });
});
