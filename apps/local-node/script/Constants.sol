// apps/indexer/contracts/script/Constants.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/**
 * @title Constants
 * @dev Shared constants for all governance scripts
 *      Contains Anvil default addresses, private keys, and contract addresses
 */
library Constants {
    // Anvil default addresses (deterministic)
    address internal constant ALICE = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address internal constant BOB = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant CHARLIE = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address internal constant DAVID = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    
    // Anvil default private keys (corresponding to the addresses above)
    uint256 internal constant ALICE_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 internal constant BOB_PRIVATE_KEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 internal constant CHARLIE_PRIVATE_KEY = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 internal constant DAVID_PRIVATE_KEY = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    
    // Contract addresses (deterministic with Anvil)
    address internal constant ENS_TOKEN_ADDRESS = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    address internal constant ENS_GOVERNOR_ADDRESS = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    address internal constant ENS_TIMELOCK_ADDRESS = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    
    // Governance vote support values
    uint8 internal constant AGAINST = 0;
    uint8 internal constant FOR = 1;
    uint8 internal constant ABSTAIN = 2;
    
    // Token amounts (in wei, using ether for readability)
    uint256 internal constant ALICE_INITIAL_TOKENS = 100 ether;
    uint256 internal constant BOB_TOKEN_TRANSFER = 10 ether;
    uint256 internal constant CHARLIE_TOKEN_TRANSFER = 5 ether;
    uint256 internal constant PROPOSAL_TOKEN_TRANSFER = 5 ether;
} 