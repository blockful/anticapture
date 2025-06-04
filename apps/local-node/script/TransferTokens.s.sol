// apps/indexer/contracts/script/TransferTokens.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title TransferTokens
 * @dev Script to distribute ENS tokens to Bob and Charlie
 *      Replaces the cast send commands with proper Solidity script
 */
contract TransferTokens is BaseScript, Test {
    ENSToken ensToken;

    function run() public {
        console.log("=== Token Transfer Script ===");
        
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();
        
        // Initialize the ENS token contract
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Display initial balances
        displayBalances("Initial");
        
        // Assert Alice has enough tokens for transfers
        uint256 totalTransferAmount = Constants.BOB_TOKEN_TRANSFER + Constants.CHARLIE_TOKEN_TRANSFER;
        assertGe(ensToken.balanceOf(Constants.ALICE), totalTransferAmount, "Alice must have enough tokens for both transfers");
        
        // Store initial balances for validation
        uint256 aliceInitialBalance = ensToken.balanceOf(Constants.ALICE);
        uint256 bobInitialBalance = ensToken.balanceOf(Constants.BOB);
        uint256 charlieInitialBalance = ensToken.balanceOf(Constants.CHARLIE);
        
        // Start broadcasting transactions (Alice is the sender)
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        
        // Transfer 10 ENS tokens to Bob
        console.log("Transferring 10 ENS to Bob...");
        ensToken.transfer(Constants.BOB, Constants.BOB_TOKEN_TRANSFER);
        
        // Transfer 5 ENS tokens to Charlie  
        console.log("Transferring 5 ENS to Charlie...");
        ensToken.transfer(Constants.CHARLIE, Constants.CHARLIE_TOKEN_TRANSFER);
        
        vm.stopBroadcast();
        
        // Assert transfers were successful
        assertEq(ensToken.balanceOf(Constants.ALICE), aliceInitialBalance - totalTransferAmount, "Alice's balance should decrease by total transfer amount");
        assertEq(ensToken.balanceOf(Constants.BOB), bobInitialBalance + Constants.BOB_TOKEN_TRANSFER, "Bob's balance should increase by transfer amount");
        assertEq(ensToken.balanceOf(Constants.CHARLIE), charlieInitialBalance + Constants.CHARLIE_TOKEN_TRANSFER, "Charlie's balance should increase by transfer amount");
        
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