#!/bin/bash

# Anvil default private keys
ALICE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BOB_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
CHARLIE_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
DAVID_KEY="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

# Start Anvil in the background with multiple accounts unlocked
echo "🚀 Starting Anvil blockchain with multiple accounts..."
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 \
  --accounts 10 \
  --balance 1000 &

# Wait for Anvil to be ready
sleep 5

echo "📋 Deploying ENS governance contracts..."
# Deploy contracts
forge script script/DeployENS.sol:DeployENS --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully"
    
    echo "🏛️ Setting up governance environment (delegation and tokens)..."
    # Run simplified governance setup with Alice only first
    forge script script/SimpleDelegation.s.sol:SimpleDelegation --rpc-url http://localhost:8545 --broadcast --private-key $ALICE_KEY
    
    if [ $? -eq 0 ]; then
        echo "✅ Basic delegation completed"
        
        # Now distribute tokens to other accounts using cast
        echo "💰 Distributing tokens to other accounts..."
        cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
          'transfer(address,uint256)' \
          0x70997970C51812dc3A010C7d01b50e0d17dc79C8 10000000000000000000 \
          --rpc-url http://localhost:8545 \
          --private-key $ALICE_KEY
        
        cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
          'transfer(address,uint256)' \
          0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC 5000000000000000000 \
          --rpc-url http://localhost:8545 \
          --private-key $ALICE_KEY
        
        # Delegate voting power for other accounts
        echo "🗳️ Setting up delegations..."
        cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
          'delegate(address)' \
          0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
          --rpc-url http://localhost:8545 \
          --private-key $BOB_KEY
        
        cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
          'delegate(address)' \
          0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
          --rpc-url http://localhost:8545 \
          --private-key $CHARLIE_KEY
        
        # Wait a moment and create some blocks
        sleep 2
        
        echo "📝 Creating governance proposal..."
        # Create a proposal using cast
        cast send 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
          'propose(address[],uint256[],bytes[],string)' \
          '[0x5FbDB2315678afecb367f032d93F642f64180aa3]' \
          '[0]' \
          '[0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000004563918244f40000]' \
          'Transfer 5 ENS tokens to Bob for community contribution' \
          --rpc-url http://localhost:8545 \
          --private-key $ALICE_KEY
        
        if [ $? -eq 0 ]; then
            echo "✅ Proposal created successfully"
            
            # Advance a few blocks to activate voting
            echo "⏭️ Advancing blocks to activate voting..."
            for i in {1..5}; do
                cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
                  'transfer(address,uint256)' \
                  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0 \
                  --rpc-url http://localhost:8545 \
                  --private-key $ALICE_KEY > /dev/null 2>&1
                sleep 1
            done
            
            echo "🗳️ Casting votes on proposal..."
            # Get the proposal ID (latest proposal)
            PROPOSAL_ID=$(cast call 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
              'hashProposal(address[],uint256[],bytes[],bytes32)' \
              '[0x5FbDB2315678afecb367f032d93F642f64180aa3]' \
              '[0]' \
              '[0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000004563918244f40000]' \
              $(cast keccak 'Transfer 5 ENS tokens to Bob for community contribution') \
              --rpc-url http://localhost:8545)
            
            # Alice votes FOR (support = 1)
            cast send 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
              'castVote(uint256,uint8)' \
              $PROPOSAL_ID 1 \
              --rpc-url http://localhost:8545 \
              --private-key $ALICE_KEY
            
            # Bob votes AGAINST (support = 0)
            cast send 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
              'castVote(uint256,uint8)' \
              $PROPOSAL_ID 0 \
              --rpc-url http://localhost:8545 \
              --private-key $BOB_KEY
            
            # Charlie votes ABSTAIN (support = 2)
            cast send 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
              'castVote(uint256,uint8)' \
              $PROPOSAL_ID 2 \
              --rpc-url http://localhost:8545 \
              --private-key $CHARLIE_KEY
            
            echo "✅ Governance simulation completed successfully"
            echo "📊 Development environment ready with:"
            echo "   - Token distributions to Alice, Bob, Charlie"
            echo "   - Delegations set up"
            echo "   - 1 active proposal with votes from all parties"
        else
            echo "❌ Proposal creation failed"
        fi
    else
        echo "❌ Governance setup failed"
    fi
else
    echo "❌ Contract deployment failed"
fi

echo "🔄 Keeping Anvil running for blockchain interactions..."
wait
