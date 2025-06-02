// apps/indexer/contracts/script/SimpleDelegation.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";
import {Constants} from "./Constants.sol";

/**
 * @title SimpleDelegation
 * @dev Simple script to delegate voting power using only Alice's key
 */
contract SimpleDelegation is BaseScript, Test {
    ENSToken public ensToken;
    ENSGovernor public ensGovernor;
    
    function setUp() public override {
        // Call parent setUp which automatically labels addresses
        super.setUp();
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
    }
    
    function run() external {
        setUp();
        
        console.log("=== Simple Delegation Script ===");
        console.log("Alice's token balance:", ensToken.balanceOf(Constants.ALICE));
        console.log("Alice's current voting power:", ensToken.getVotes(Constants.ALICE));
        
        // Assert Alice has some token balance before delegation
        assertGt(ensToken.balanceOf(Constants.ALICE), 0, "Alice must have token balance");
        
        // Alice delegates to herself
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        ensToken.delegate(Constants.ALICE);
        vm.stopBroadcast();
        
        console.log("Alice delegated to herself");
        console.log("Alice's new voting power:", ensToken.getVotes(Constants.ALICE));
        console.log("Current block:", block.number);
        
        // Assert that Alice now has voting power equal to her token balance
        assertEq(ensToken.getVotes(Constants.ALICE), ensToken.balanceOf(Constants.ALICE), "Voting power should equal token balance after delegation");
        
        // Use vm.roll to cleanly advance blocks (much better than dummy transactions)
        uint256 currentBlock = block.number;
        uint256 targetBlock = currentBlock + 3;
        
        console.log("Advancing blocks using vm.roll...");
        vm.roll(targetBlock);
        
        console.log("Advanced to block:", block.number);
        console.log("Alice's final voting power:", ensToken.getVotes(Constants.ALICE));
        
        // Assert we successfully advanced blocks
        assertEq(block.number, targetBlock, "Block should have advanced to target block");
        
        // Check if Alice can create proposals using assertion
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        console.log("Proposal threshold:", proposalThreshold);
        
        // Use assertGe instead of conditional check
        assertGe(ensToken.getVotes(Constants.ALICE), proposalThreshold, "Alice must have enough voting power to create proposals");
        console.log("SUCCESS: Alice can now create proposals!");
    }
} 