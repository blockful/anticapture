#!/bin/bash

# Start anvil in the background and keep a reference to its PID
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 &
ANVIL_PID=$!

# Function to check if Anvil is ready
function wait_for_anvil() {
  echo "⏳ Waiting for Anvil to be ready at localhost:8545..."
  until curl -s http://localhost:8545 >/dev/null; do
    sleep 0.5
  done
  echo "✅ Anvil is ready!"
}

wait_for_anvil

# Deploy contracts using the first private key from Anvil
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployENS.sol:DeployENS \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --rpc-url http://localhost:8545

# Wait for Anvil process to keep container alive and output visible
wait $ANVIL_PID
