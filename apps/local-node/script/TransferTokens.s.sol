// apps/indexer/contracts/script/TransferTokens.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title TransferTokens
 * @dev Script to distribute ENS tokens to Bob and Charlie
 *      Replaces the cast send commands with proper Solidity script
 */
contract TransferTokens is Script {
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
        console.log("=== Token Transfer Script ===");
        
        // Label addresses for better readability in logs
        labelAddresses();
        
        // Initialize the ENS token contract
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Display initial balances
        displayBalances("Initial");
        
        // Start broadcasting transactions (Alice is the sender)
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        
        // Transfer 10 ENS tokens to Bob
        console.log("Transferring 10 ENS to Bob...");
        ensToken.transfer(Constants.BOB, Constants.BOB_TOKEN_TRANSFER);
        
        // Transfer 5 ENS tokens to Charlie  
        console.log("Transferring 5 ENS to Charlie...");
        ensToken.transfer(Constants.CHARLIE, Constants.CHARLIE_TOKEN_TRANSFER);
        
        vm.stopBroadcast();
        
        // Display final balances
        displayBalances("Final");
        
        console.log("SUCCESS: Token transfers completed!");
    }
    
    /**
     * @dev Display token balances for all participants
     */
    function displayBalances(string memory label) internal view {
        console.log(string.concat("--- ", label, " Token Balances ---"));
        console.log("Alice:", ensToken.balanceOf(Constants.ALICE) / 1e18, "ENS");
        console.log("Bob:", ensToken.balanceOf(Constants.BOB) / 1e18, "ENS");
        console.log("Charlie:", ensToken.balanceOf(Constants.CHARLIE) / 1e18, "ENS");
        console.log("");
    }
} 