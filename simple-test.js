const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { AnchorProvider, Wallet, Program } = require('@coral-xyz/anchor');
const fs = require('fs');

async function simpleTest() {
  console.log("🧪 Simple SBT Testing with Explorer Links");
  console.log("==========================================");
  
  try {
    // Load wallet
    const keypairFile = process.env.ANCHOR_WALLET || '/home/lalit/.config/solana/id.json';
    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(keypairFile, 'utf8')))
    );
    const wallet = new Wallet(keypair);
    
    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    
    // Load program
    const programId = new PublicKey('FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN');
    const idl = JSON.parse(fs.readFileSync('./target/idl/devrupt.json', 'utf8'));
    const program = new Program(idl, provider);

    console.log("✅ Setup complete");
    console.log("💰 Wallet:", wallet.publicKey.toString());
    console.log("🔗 Program:", programId.toString());
    console.log("");

    // Calculate PDAs
    const [contributorStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
      programId
    );

    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), wallet.publicKey.toBuffer()],
      programId
    );

    console.log("📍 ACCOUNT ADDRESSES:");
    console.log("=====================");
    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Program:", programId.toString());
    console.log("Contributor State:", contributorStatePda.toString());
    console.log("Mint PDA:", mintPda.toString());
    console.log("");

    console.log("🌐 EXPLORER LINKS:");
    console.log("==================");
    console.log("🔗 Program: https://explorer.solana.com/address/" + programId.toString() + "?cluster=devnet");
    console.log("🔗 Wallet: https://explorer.solana.com/address/" + wallet.publicKey.toString() + "?cluster=devnet");
    console.log("🔗 Contributor State: https://explorer.solana.com/address/" + contributorStatePda.toString() + "?cluster=devnet");
    console.log("🔗 Mint PDA: https://explorer.solana.com/address/" + mintPda.toString() + "?cluster=devnet");
    console.log("");

    console.log("📋 MANUAL TESTING INSTRUCTIONS:");
    console.log("================================");
    console.log("1. Use the Solana CLI or anchor commands to interact with the program");
    console.log("2. Check the explorer links above to see account states");
    console.log("3. View transaction history on your wallet in the explorer");
    console.log("");

    console.log("🛠️ CLI COMMANDS TO RUN:");
    console.log("========================");
    console.log("# Check program deployment:");
    console.log("solana account " + programId.toString());
    console.log("");
    console.log("# Check contributor state (after initialization):");
    console.log("solana account " + contributorStatePda.toString());
    console.log("");
    console.log("# Check mint account (after SBT minting):");
    console.log("solana account " + mintPda.toString());
    console.log("");

    console.log("✅ Test setup complete! Use the explorer links and CLI commands above to verify the program.");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

simpleTest().catch(console.error);
