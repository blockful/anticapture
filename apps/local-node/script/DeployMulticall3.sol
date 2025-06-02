// apps/local-node/script/DeployMulticall3.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {Script, console} from "forge-std/Script.sol";
import {BaseScript} from "./BaseScript.sol";
import {Constants} from "./Constants.sol";

// Import the local copy of Multicall3 contract
// This is an exact copy of the official Multicall3 contract
// Source: https://github.com/mds1/multicall3/blob/main/src/Multicall3.sol
import {Multicall3} from "../src/Multicall3.sol";

/**
 * @title DeployMulticall3
 * @dev Deploy the official Multicall3 contract for efficient batch calls
 *      This uses a local copy of the authentic contract from the mds1/multicall3 repository
 *      to avoid dependency issues while maintaining the exact same functionality
 */
contract DeployMulticall3 is BaseScript {
    function run() external {
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();
        
        console.log("=== Deploying Official Multicall3 Contract ===");
        console.log("Source: https://github.com/mds1/multicall3/blob/main/src/Multicall3.sol");
        console.log("This is the same contract deployed on 250+ chains at 0xcA11bde05977b3631167028862bE2a173976CA11");
        console.log("Local copy used to avoid dependency issues while maintaining exact functionality");
        
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        
        // Deploy the official Multicall3 contract
        Multicall3 multicall3 = new Multicall3();
        
        vm.stopBroadcast();
        
        console.log("Multicall3 deployed successfully");
        console.log("Multicall3 address:", address(multicall3));
        
        // Verify the deployment worked by calling some view functions
        uint256 blockNumber = multicall3.getBlockNumber();
        uint256 chainId = multicall3.getChainId();
        console.log("Verification - Current block number:", blockNumber);
        console.log("Verification - Chain ID:", chainId);
        
        // Ensure this matches our expected address in Constants
        require(address(multicall3) == Constants.MULTICALL3_ADDRESS, "Multicall3 address mismatch");
        console.log(unicode"✅ Multicall3 deployed at expected deterministic address");
    }
} 