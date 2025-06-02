// apps/local-node/script/BaseScript.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {Script} from "forge-std/Script.sol";
import {Constants} from "./Constants.sol";

/**
 * @title BaseScript
 * @dev Base contract for all governance scripts with shared functionality
 *      Provides address labeling and common utilities
 */
abstract contract BaseScript is Script {
    
    /**
     * @dev Label addresses for better readability in logs
     *      This function should be called at the start of any script's run() function
     */
    function labelAddresses() internal {
        // Label user addresses
        vm.label(Constants.ALICE, "Alice");
        vm.label(Constants.BOB, "Bob");
        vm.label(Constants.CHARLIE, "Charlie");
        vm.label(Constants.DAVID, "David");
        
        // Label contract addresses (updated for new deployment order)
        vm.label(Constants.MULTICALL3_ADDRESS, "Multicall3");
        vm.label(Constants.ENS_TOKEN_ADDRESS, "ENSToken");
        vm.label(Constants.ENS_GOVERNOR_ADDRESS, "ENSGovernor");
        vm.label(Constants.ENS_TIMELOCK_ADDRESS, "ENSTimelock");
    }
    
    /**
     * @dev Setup function that automatically labels addresses
     *      Override this in child contracts if you need custom setup
     */
    function setUp() public virtual {
        labelAddresses();
    }
} 