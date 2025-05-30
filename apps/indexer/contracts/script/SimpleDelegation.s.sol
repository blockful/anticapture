// apps/indexer/contracts/script/SimpleDelegation.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";
import {Constants} from "./Constants.sol";

/**
 * @title SimpleDelegation
 * @dev Simple script to delegate voting power using only Alice's key
 */
contract SimpleDelegation is Script {
    ENSToken public ensToken;
    ENSGovernor public ensGovernor;
    
    function setUp() public {
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
    }
    
    function run() external {
        setUp();
        
        console.log("=== Simple Delegation Script ===");
        console.log("Alice's token balance:", ensToken.balanceOf(Constants.ALICE));
        console.log("Alice's current voting power:", ensToken.getVotes(Constants.ALICE));
        
        // Alice delegates to herself
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        ensToken.delegate(Constants.ALICE);
        vm.stopBroadcast();
        
        console.log("Alice delegated to herself");
        console.log("Alice's new voting power:", ensToken.getVotes(Constants.ALICE));
        console.log("Current block:", block.number);
        
        // Use vm.roll to cleanly advance blocks (much better than dummy transactions)
        uint256 currentBlock = block.number;
        uint256 targetBlock = currentBlock + 3;
        
        console.log("Advancing blocks using vm.roll...");
        vm.roll(targetBlock);
        
        console.log("Advanced to block:", block.number);
        console.log("Alice's final voting power:", ensToken.getVotes(Constants.ALICE));
        
        // Check if Alice can create proposals
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        console.log("Proposal threshold:", proposalThreshold);
        
        if (ensToken.getVotes(Constants.ALICE) >= proposalThreshold) {
            console.log("SUCCESS: Alice can now create proposals!");
        } else {
            console.log("ERROR: Alice still cannot create proposals");
        }
    }
} 