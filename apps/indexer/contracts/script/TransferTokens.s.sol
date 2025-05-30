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

    function run() public {
        console.log("=== Token Transfer Script ===");
        
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