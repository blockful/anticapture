// apps/local-node/script/FundTimelock.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title FundTimelock
 * @dev Script to transfer treasury funds from Alice to the ENSTimelock
 *      This allows governance proposals to distribute tokens from the DAO treasury
 */
contract FundTimelock is BaseScript, Test {
    ENSToken ensToken;
    
    // Amount to transfer to timelock as treasury funds
    uint256 constant TREASURY_AMOUNT = 50 ether; // 50 ENS tokens for governance distribution

    function run() public {
        console.log("=== Funding ENS Timelock Treasury ===");
        
        labelAddresses();
        
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Display initial balances
        console.log("Initial balances:");
        console.log("Alice:", ensToken.balanceOf(Constants.ALICE) / 1e18, "ENS");
        console.log("ENSTimelock:", ensToken.balanceOf(Constants.ENS_TIMELOCK_ADDRESS) / 1e18, "ENS");
        
        // Check if timelock already has funds
        uint256 timelockBalance = ensToken.balanceOf(Constants.ENS_TIMELOCK_ADDRESS);
        uint256 aliceBalance = ensToken.balanceOf(Constants.ALICE);
        
        if (timelockBalance >= TREASURY_AMOUNT) {
            console.log("ENSTimelock already has sufficient treasury funds");
        } else {
            uint256 amountNeeded = TREASURY_AMOUNT - timelockBalance;
            uint256 amountToTransfer = aliceBalance < amountNeeded ? aliceBalance : amountNeeded;
            
            if (amountToTransfer > 0) {
                console.log("Transferring", amountToTransfer / 1e18, "ENS from Alice to ENSTimelock");
                vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
                ensToken.transfer(Constants.ENS_TIMELOCK_ADDRESS, amountToTransfer);
                vm.stopBroadcast();
            } else {
                console.log("Warning: Alice has no tokens to transfer");
            }
        }
        
        // Display final balances
        console.log("Final balances:");
        console.log("Alice:", ensToken.balanceOf(Constants.ALICE) / 1e18, "ENS");
        console.log("ENSTimelock:", ensToken.balanceOf(Constants.ENS_TIMELOCK_ADDRESS) / 1e18, "ENS");
        
        // Verify final state
        uint256 finalTimelockBalance = ensToken.balanceOf(Constants.ENS_TIMELOCK_ADDRESS);
        console.log("SUCCESS: ENSTimelock now has", finalTimelockBalance / 1e18, "ENS tokens");
        console.log("Governance proposals can now distribute these funds!");
    }
} 