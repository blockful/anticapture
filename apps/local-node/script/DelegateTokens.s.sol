// apps/indexer/contracts/script/DelegateTokens.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title DelegateTokens
 * @dev Script to set up delegation for Bob and Charlie
 *      Each account delegates to themselves to activate their voting power
 */
contract DelegateTokens is Script {
    ENSToken ensToken;

    /**
     * @dev Label addresses for better readability in logs
     */
    function labelAddresses() internal {
        // Label user addresses
        vm.label(Constants.ALICE, "Alice");
        vm.label(Constants.BOB, "Bob");
        vm.label(Constants.CHARLIE, "Charlie");
        vm.label(Constants.DAVID, "David");
        
        // Label contract addresses
        vm.label(Constants.ENS_TOKEN_ADDRESS, "ENSToken");
        vm.label(Constants.ENS_GOVERNOR_ADDRESS, "ENSGovernor");
        vm.label(Constants.ENS_TIMELOCK_ADDRESS, "ENSTimelock");
    }

    function run() public {
        console.log("=== Delegation Setup Script ===");
        
        // Label addresses for better readability in logs
        labelAddresses();
        
        // Initialize the ENS token contract
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Display initial voting power
        displayVotingPower("Initial");
        
        // Bob delegates to himself
        console.log("Setting up Bob's delegation...");
        vm.startBroadcast(Constants.BOB_PRIVATE_KEY);
        ensToken.delegate(Constants.BOB);
        vm.stopBroadcast();
        console.log("SUCCESS: Bob delegated to himself");
        
        // Charlie delegates to himself
        console.log("Setting up Charlie's delegation...");
        vm.startBroadcast(Constants.CHARLIE_PRIVATE_KEY);
        ensToken.delegate(Constants.CHARLIE);
        vm.stopBroadcast();
        console.log("SUCCESS: Charlie delegated to himself");
        
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