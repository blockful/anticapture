// apps/indexer/contracts/script/SimpleDelegation.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";

/**
 * @title SimpleDelegation
 * @dev Simple script to delegate voting power using only Alice's key
 */
contract SimpleDelegation is Script {
    ENSToken public ensToken;
    ENSGovernor public ensGovernor;
    
    address public alice = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    
    function setUp() public {
        ensToken = ENSToken(0x5FbDB2315678afecb367f032d93F642f64180aa3);
        ensGovernor = ENSGovernor(payable(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0));
    }
    
    function run() external {
        setUp();
        
        console.log("=== Simple Delegation Script ===");
        console.log("Alice's token balance:", ensToken.balanceOf(alice));
        console.log("Alice's current voting power:", ensToken.getVotes(alice));
        
        // Alice delegates to herself
        vm.startBroadcast(alice);
        ensToken.delegate(alice);
        vm.stopBroadcast();
        
        console.log("Alice delegated to herself");
        console.log("Alice's new voting power:", ensToken.getVotes(alice));
        console.log("Current block:", block.number);
        
        // Create a few dummy transactions to advance blocks
        for (uint i = 0; i < 3; i++) {
            vm.startBroadcast(alice);
            ensToken.transfer(alice, 0); // Dummy transfer to advance blocks
            vm.stopBroadcast();
        }
        
        console.log("Advanced 3 blocks");
        console.log("Final block:", block.number);
        console.log("Alice's final voting power:", ensToken.getVotes(alice));
        
        // Check if Alice can create proposals
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        console.log("Proposal threshold:", proposalThreshold);
        
        if (ensToken.getVotes(alice) >= proposalThreshold) {
            console.log("SUCCESS: Alice can now create proposals!");
        } else {
            console.log("ERROR: Alice still cannot create proposals");
        }
    }
} 