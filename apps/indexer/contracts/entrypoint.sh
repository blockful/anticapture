#!/bin/bash

anvil &
sleep 3

# Deploy contracts using the first private key from Anvil
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployENS.sol:DeployENS \
  --private-key $PRIVATE_KEY \
  --broadcast

# Keep the container running (remove this if you run your own service after)
tail -f /dev/null
