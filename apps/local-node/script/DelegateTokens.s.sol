// apps/indexer/contracts/script/DelegateTokens.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title DelegateTokens
 * @dev Script to set up delegation for Bob and Charlie
 *      Each account delegates to themselves to activate their voting power
 */
contract DelegateTokens is BaseScript, Test {
    ENSToken ensToken;

    function run() public {
        console.log("=== Delegation Setup Script ===");
        
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();
        
        // Initialize the ENS token contract
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Display initial voting power
        displayVotingPower("Initial");
        
        // Assert Bob has token balance before delegation
        assertGt(ensToken.balanceOf(Constants.BOB), 0, "Bob must have token balance before delegation");
        // Assert Bob has no voting power before delegation
        assertEq(ensToken.getVotes(Constants.BOB), 0, "Bob should have no voting power before delegation");
        
        // Bob delegates to himself
        console.log("Setting up Bob's delegation...");
        vm.startBroadcast(Constants.BOB_PRIVATE_KEY);
        ensToken.delegate(Constants.BOB);
        vm.stopBroadcast();
        console.log("SUCCESS: Bob delegated to himself");
        
        // Assert Bob now has voting power equal to his token balance
        assertEq(ensToken.getVotes(Constants.BOB), ensToken.balanceOf(Constants.BOB), "Bob's voting power should equal his token balance after delegation");
        
        // Assert Charlie has token balance before delegation
        assertGt(ensToken.balanceOf(Constants.CHARLIE), 0, "Charlie must have token balance before delegation");
        // Assert Charlie has no voting power before delegation
        assertEq(ensToken.getVotes(Constants.CHARLIE), 0, "Charlie should have no voting power before delegation");
        
        // Charlie delegates to himself
        console.log("Setting up Charlie's delegation...");
        vm.startBroadcast(Constants.CHARLIE_PRIVATE_KEY);
        ensToken.delegate(Constants.CHARLIE);
        vm.stopBroadcast();
        console.log("SUCCESS: Charlie delegated to himself");
        
        // Assert Charlie now has voting power equal to his token balance
        assertEq(ensToken.getVotes(Constants.CHARLIE), ensToken.balanceOf(Constants.CHARLIE), "Charlie's voting power should equal his token balance after delegation");
        
        // Display final voting power
        displayVotingPower("Final");
        
        console.log("SUCCESS: Delegations completed!");
    }
    
    /**
     * @dev Display voting power for all participants
     */
    function displayVotingPower(string memory label) internal view {
        console.log(string.concat("--- ", label, " Voting Power ---"));
        console.log("Alice:", ensToken.getVotes(Constants.ALICE) / 1e18, "votes");
        console.log("Bob:", ensToken.getVotes(Constants.BOB) / 1e18, "votes");
        console.log("Charlie:", ensToken.getVotes(Constants.CHARLIE) / 1e18, "votes");
        console.log("");
    }
} 