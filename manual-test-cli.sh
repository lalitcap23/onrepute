#!/bin/bash

echo "🧪 Manual SBT Testing with Solana CLI"
echo "====================================="

# Program ID
PROGRAM_ID="FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN"
WALLET=$(solana config get | grep "Keypair Path" | cut -d: -f2 | xargs)

echo "🔗 Program: $PROGRAM_ID"
echo "💰 Wallet: $(solana address)"
echo "💵 Balance: $(solana balance)"
echo ""

echo "🌐 EXPLORER LINKS:"
echo "=================="
echo "🔗 Program: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "🔗 Wallet: https://explorer.solana.com/address/$(solana address)?cluster=devnet"
echo ""

echo "📍 DERIVED ADDRESSES:"
echo "===================="

# Calculate PDAs (this would require anchor CLI or custom script)
echo "ℹ️ To calculate exact PDAs, use the test script or anchor CLI"
echo ""

echo "🛠️ MANUAL TESTING STEPS:"
echo "========================"
echo "1. Check program deployment:"
echo "   solana account $PROGRAM_ID"
echo ""
echo "2. View your wallet transactions:"
echo "   https://explorer.solana.com/address/$(solana address)?cluster=devnet"
echo ""
echo "3. Use the test script for full SBT flow:"
echo "   cd /home/lalit/code-verse/experment\\ /anchor"
echo "   ANCHOR_WALLET=$WALLET npx mocha tests/working-test.ts --require ts-node/register"
echo ""

echo "✅ Manual testing setup complete!"
echo "📊 Check the explorer links above to verify program deployment"
echo "🎯 Run the test script to see the complete SBT minting flow"
