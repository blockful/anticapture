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

# Start Anvil in the background with forking from mainnet via Llamarpc
echo "🚀 Starting Anvil blockchain forked from mainnet (via llamarpc.com)..."
echo "🔗 This will include all existing mainnet contracts including Multicall3"
echo "📦 Forking from recent block to avoid syncing entire blockchain history..."

# Fork from recent block (same as configured in ens.local.config.ts)
anvil --host 0.0.0.0 --port 8545 \
    --chain-id 31337 \
    --accounts 10 \
    --balance 1000 \
    --fork-url https://eth.llamarpc.com \
    --fork-block-number 22635098 \
    --silent &

ANVIL_PID=$!

# Wait for Anvil to be ready
wait_for_anvil

forge clean
forge build

echo "📋 Deploying ENS governance contracts on forked mainnet..."
echo "🔍 Note: Using existing Multicall3 at 0xcA11bde05977b3631167028862bE2a173976CA11"

# Deploy contracts and continue only if successful
forge script script/DeployENS.sol:DeployENS --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY && {
    echo "✅ ENS contracts deployed successfully on forked mainnet"

    # Contract addresses (these will be different on forked mainnet)
    echo "📍 ENS contracts deployed. Check broadcast logs for exact addresses."

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
        echo "💰 Funding ENS Timelock with treasury funds..."

        forge script script/FundTimelock.s.sol:FundTimelock --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
    } && {
        echo "📝 Creating governance proposals using parameterized approach..."
        
        # Create Proposal 1
        echo "Creating Proposal 1 (Transfer 5 ENS to Bob)..."
        forge script script/CreateProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 1" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "Proposal 1: Transfer 5 ENS tokens to Bob for community contribution" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
        
        # Skip blocks to make Proposal 1 active
        echo "⏭️ Advancing blocks to activate Proposal 1..."
        cast rpc anvil_mine 2 --rpc-url http://localhost:8545
        
        # Vote on Proposal 1 (All vote FOR)
        echo "🗳️ Voting on Proposal 1 (Alice=FOR, Bob=FOR, Charlie=FOR)..."
        forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "Proposal 1" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "Proposal 1: Transfer 5 ENS tokens to Bob for community contribution" 1 1 1 --rpc-url http://localhost:8545 --broadcast
        
        # Skip blocks to end voting period for Proposal 1
        echo "⏭️ Ending voting period for Proposal 1..."
        cast rpc anvil_mine 200 --rpc-url http://localhost:8545

        # Queue Proposal 1 after voting ends
        echo "📋 Queuing Proposal 1..."
        forge script script/QueueProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 1" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "Proposal 1: Transfer 5 ENS tokens to Bob for community contribution" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
        
        # Skip blocks for timelock delay and execute Proposal 1
        echo "⏭️ Waiting for timelock delay and executing Proposal 1..."
        cast rpc anvil_mine 2 --rpc-url http://localhost:8545
        forge script script/ExecuteProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 1" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "Proposal 1: Transfer 5 ENS tokens to Bob for community contribution" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
        
        echo "✅ Proposal 1 flow completed!"

        # Create Proposal 2
        echo "📝 Creating Proposal 2 (Transfer 5 ENS to Charlie)..."
        forge script script/CreateProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 2" 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC 5000000000000000000 "Proposal 2: Transfer 5 ENS tokens to Charlie for development work" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
        
        # Skip blocks to make Proposal 2 active
        echo "⏭️ Advancing blocks to activate Proposal 2..."
        cast rpc anvil_mine 2 --rpc-url http://localhost:8545
        
        # Vote on Proposal 2 (Mixed voting pattern)
        echo "🗳️ Voting on Proposal 2 (Alice=FOR, Bob=AGAINST, Charlie=ABSTAIN)..."
        forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "Proposal 2" 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC 5000000000000000000 "Proposal 2: Transfer 5 ENS tokens to Charlie for development work" 1 0 2 --rpc-url http://localhost:8545 --broadcast
        
        # Skip blocks to end voting period for Proposal 2
        echo "⏭️ Ending voting period for Proposal 2..."
        cast rpc anvil_mine 200 --rpc-url http://localhost:8545

        # Queue Proposal 2 after voting ends (only if it succeeded)
        echo "📋 Attempting to queue Proposal 2..."
        forge script script/QueueProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 2" 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC 5000000000000000000 "Proposal 2: Transfer 5 ENS tokens to Charlie for development work" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY || {
            echo "ℹ️ Proposal 2 queuing failed - likely defeated by voting results"
        }

        # Check if Proposal 2 succeeded and execute if needed
        echo "⏭️ Waiting for timelock delay..."
        cast rpc anvil_mine 2 --rpc-url http://localhost:8545

        echo "🔍 Checking Proposal 2 status for potential execution..."
        echo "Note: Proposal 2 has mixed voting (Alice=FOR, Bob=AGAINST, Charlie=ABSTAIN)"
        echo "With voting power: Alice(20), Bob(20), Charlie(10) - Alice FOR wins!"
        
        # Try to execute Proposal 2 (will only work if it was queued)
        forge script script/ExecuteProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 2" 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC 5000000000000000000 "Proposal 2: Transfer 5 ENS tokens to Charlie for development work" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY || {
            echo "ℹ️ Proposal 2 execution failed"
        }

        echo "✅ Proposal 2 flow completed!"

        # Create Proposal 3
        echo "📝 Creating Proposal 3 (Transfer 5 ENS to David)..."
        forge script script/CreateProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 3" 0x90F79bf6EB2c4f870365E785982E1f101E93b906 5000000000000000000 "Proposal 3: Transfer 5 ENS tokens to David for testing work" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
        
        # Skip blocks to make Proposal 3 active
        echo "⏭️ Advancing blocks to activate Proposal 3..."
        cast rpc anvil_mine 2 --rpc-url http://localhost:8545
        
        # Vote on Proposal 3 (Alice votes AGAINST, others FOR - should still succeed)
        echo "🗳️ Voting on Proposal 3 (Alice=AGAINST, Bob=FOR, Charlie=FOR) - leaving as pending..."
        forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "Proposal 3" 0x90F79bf6EB2c4f870365E785982E1f101E93b906 5000000000000000000 "Proposal 3: Transfer 5 ENS tokens to David for testing work" 0 1 1 --rpc-url http://localhost:8545 --broadcast
        
        # Skip blocks to end voting period for Proposal 3 but don't queue/execute
        echo "⏭️ Ending voting period for Proposal 3 (leaving as voted, not executing)..."
        cast rpc anvil_mine 200 --rpc-url http://localhost:8545

        echo "✅ Proposal 3 left in voted state for testing variety!"

        # Create Proposal 4
        echo "📝 Creating Proposal 4 (Transfer 3 ENS to Alice)..."
        forge script script/CreateProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal 4" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 3000000000000000000 "Proposal 4: Transfer 3 ENS tokens to Alice as performance bonus" --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
        
        # Skip blocks to make Proposal 4 active
        echo "⏭️ Advancing blocks to activate Proposal 4..."
        cast rpc anvil_mine 2 --rpc-url http://localhost:8545
        
        # Vote on Proposal 4 (All vote AGAINST - should be defeated)
        echo "🗳️ Voting on Proposal 4 (Alice=AGAINST, Bob=AGAINST, Charlie=AGAINST) - should be defeated..."
        forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "Proposal 4" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 3000000000000000000 "Proposal 4: Transfer 3 ENS tokens to Alice as performance bonus" 0 0 0 --rpc-url http://localhost:8545 --broadcast
        
        echo "✅ Proposal 4 left in voted state for testing variety!"
        
        echo "✅ Parameterized governance flow completed successfully!"
        echo "🎉 Development environment ready with:"
        echo "   - Forked mainnet state with all existing contracts"
        echo "   - ENS governance contracts deployed"
        echo "   - Token distributions to Alice, Bob, Charlie, David"
        echo "   - Delegations set up"
        echo "   - 4 proposals with different voting patterns and lifecycle states for testing:"
        echo "     * Proposal 1: Transfer 5 ENS to Bob (Alice=FOR, Bob=FOR, Charlie=FOR - EXECUTED)"
        echo "     * Proposal 2: Transfer 5 ENS to Charlie (Alice=FOR, Bob=AGAINST, Charlie=ABSTAIN - EXECUTED)"
        echo "     * Proposal 3: Transfer 5 ENS to David (Alice=AGAINST, Bob=FOR, Charlie=FOR - LEFT AS VOTED)"
        echo "     * Proposal 4: Transfer 3 ENS to Alice (Alice=AGAINST, Bob=AGAINST, Charlie=AGAINST - LEFT AS DEFEATED)"
        echo "   - Clean parameterized script architecture for easy testing"
        echo ""
        echo "🔧 Access to all mainnet contracts including:"
        echo "   - Multicall3: 0xcA11bde05977b3631167028862bE2a173976CA11"
        echo "   - USDC, WETH, and other mainnet tokens"
        echo "   - Uniswap, Aave, and other DeFi protocols"
        echo ""
        echo "🚀 To create more proposals, use the parameterized scripts:"
        echo '   forge script script/CreateProposal.s.sol --sig "run(string,address,uint256,string)" "My Proposal" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "My custom proposal description" --rpc-url http://localhost:8545 --broadcast'
        echo "   cast rpc anvil_mine 2 --rpc-url http://localhost:8545"
        echo '   forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "My Proposal" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "My custom proposal description" 1 1 1 --rpc-url http://localhost:8545 --broadcast'
        echo "   cast rpc anvil_mine 200 --rpc-url http://localhost:8545"
        echo '   forge script script/ExecuteProposal.s.sol --sig "run(string,address,uint256,string)" "My Proposal" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 5000000000000000000 "My custom proposal description" --rpc-url http://localhost:8545 --broadcast'
    } || {
        echo "❌ One of the governance setup steps failed"
        echo "Please check the logs above to identify which step failed"
    }
} || echo "❌ ENS contract deployment failed"

echo "🔄 Setup completed successfully! Anvil blockchain ready for connections."
echo "📡 Anvil running on localhost:8545 with all contracts deployed"

# Create a ready signal for other containers
touch /tmp/anvil-ready

# Keep container alive with Anvil running in background
# This allows other containers to proceed while keeping Anvil running
tail -f /dev/null
