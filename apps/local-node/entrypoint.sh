#!/bin/bash

# Anvil default private keys
ALICE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BOB_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
CHARLIE_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
DAVID_KEY="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

# Function to check if Anvil is ready
function wait_for_anvil() {
  echo "⏳ Waiting for Anvil to be ready at localhost:8545..."
  until curl -s http://localhost:8545 >/dev/null; do
    sleep 0.5
  done
  echo "✅ Anvil is ready!"
}

# Start Anvil in the background with multiple accounts unlocked
echo "🚀 Starting Anvil blockchain with multiple accounts..."
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 \
  --accounts 10 \
  --balance 1000 &

# Wait for Anvil to be ready
wait_for_anvil

echo "📋 Deploying ENS governance contracts..."
# Deploy contracts and continue only if successful
forge script script/DeployENS.sol:DeployENS --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY && {
    echo "✅ Contracts deployed successfully"
    
    # Contract addresses (these are deterministic with Anvil)
    ENS_TOKEN_ADDR="0x5FbDB2315678afecb367f032d93F642f64180aa3"
    ENS_GOVERNOR_ADDR="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    ENS_TIMELOCK_ADDR="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    
    echo "📍 Contract addresses:"
    echo "   ENS Token: $ENS_TOKEN_ADDR"
    echo "   ENS Governor: $ENS_GOVERNOR_ADDR"
    echo "   ENS Timelock: $ENS_TIMELOCK_ADDR"
    
    echo "🏛️ Setting up governance environment (delegation and tokens)..."
    # Chain all governance setup steps
    forge script script/SimpleDelegation.s.sol:SimpleDelegation --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY && {
        echo "✅ Basic delegation completed"
        echo "💰 Distributing tokens to other accounts..."
        
        forge script script/TransferTokens.s.sol:TransferTokens --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
    } && {
        echo "✅ Token distribution completed"
        echo "🗳️ Setting up delegations..."
        
        forge script script/DelegateTokens.s.sol:DelegateTokens --rpc-url http://localhost:8545 --broadcast
        sleep 2
    } && {
        echo "📝 Creating governance proposal..."
        
        forge script script/CreateProposal.s.sol:CreateProposal --rpc-url http://localhost:8545 --broadcast
    } && {
        echo "✅ Proposal created successfully"
        echo "⏭️ Advancing blocks to activate voting..."
        echo "Mining 5 blocks using Anvil's mine function..."
        
        cast rpc anvil_mine 5 --rpc-url http://localhost:8545
        
        echo "🗳️ Casting votes on proposal..."
        # Cast all votes using Solidity script
        forge script script/CastVotes.s.sol:CastVotes \
          --rpc-url http://localhost:8545 \
          --broadcast
        
        echo "✅ Governance simulation completed successfully"
        echo "📊 Development environment ready with:"
        echo "   - Token distributions to Alice, Bob, Charlie"
        echo "   - Delegations set up"
        echo "   - 1 active proposal with votes from all parties"
    } || {
        echo "❌ One of the governance setup steps failed"
        echo "Please check the logs above to identify which step failed"
    }
} || echo "❌ Contract deployment failed"

echo "🔄 Keeping Anvil running for blockchain interactions..."
wait
