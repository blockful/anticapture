// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {Script, console} from "forge-std/Script.sol";
import {BaseScript} from "./BaseScript.sol";
import {Constants} from "./Constants.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";

/**
 * @title Multicall3Operations
 * @dev Script to perform multiple operations using Multicall3 contract
 *      Creates complex scenarios with multiple transfers and delegations in single transactions
 *      
 *      Note: Alice starts with 100 ENS but transfers away:
 *      - 10 ENS to Bob (TransferTokens.s.sol)
 *      - 5 ENS to Charlie (TransferTokens.s.sol) 
 *      - 50 ENS to Timelock (FundTimelock.s.sol)
 *      = 35 ENS remaining for multicall operations
 */
contract Multicall3Operations is BaseScript {
    ENSToken public ensToken;
    
    // Multicall3 contract address on mainnet
    address constant MULTICALL3 = 0xcA11bde05977b3631167028862bE2a173976CA11;
    
    // Multicall3 structs
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }
    
    struct Result {
        bool success;
        bytes returnData;
    }

    function setUp() public override {
        super.setUp();
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
    }

    /**
     * @dev Execute multicall operation 1: Multiple transfers in one transaction
     */
    function runOperation1() public {
        console.log("=== Multicall3 Operation 1: Multiple transfers in one transaction ===");
        
        // Initialize token contract and check balance
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        uint256 aliceBalance = ensToken.balanceOf(Constants.ALICE);
        console.log("Alice's balance before multicall:", aliceBalance / 1e18, "ENS");
        console.log("Alice's balance (wei):", aliceBalance);
        
        // Approve Multicall3 to spend Alice's tokens
        console.log("Approving Multicall3 to spend Alice's tokens...");
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        ensToken.approve(MULTICALL3, type(uint256).max);
        vm.stopBroadcast();
        
        // Prepare multiple transfer calls using transferFrom instead of transfer
        Call3[] memory calls = new Call3[](4);
        
        // Transfer 1: Alice to Bob (0.01 ENS) - using transferFrom
        calls[0] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.BOB, 0.01 ether)
        });
        
        // Transfer 2: Alice to Charlie (0.01 ENS) - using transferFrom
        calls[1] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.CHARLIE, 0.01 ether)
        });
        
        // Transfer 3: Alice to David (0.01 ENS) - using transferFrom
        calls[2] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.DAVID, 0.01 ether)
        });
        
        // Transfer 4: Alice to Alice (0.01 ENS) - self transfer for testing using transferFrom
        calls[3] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.ALICE, 0.01 ether)
        });
        
        console.log("Executing 4 transfers in one transaction...");
        
        // Execute multicall
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        (bool success, bytes memory data) = MULTICALL3.call(
            abi.encodeWithSignature("aggregate3((address,bool,bytes)[])", calls)
        );
        vm.stopBroadcast();
        
        require(success, "Multicall3 operation 1 failed");
        console.log("Multicall3 Operation 1 completed!");
    }

    /**
     * @dev Execute multicall operation 2: Multiple delegations in one transaction
     */
    function runOperation2() public {
        console.log("=== Multicall3 Operation 2: Multiple delegations from different accounts ===");
        
        // We need to do this differently since delegations come from different accounts
        // Let's create separate multicall transactions for each account
        
        // Bob's delegations
        Call3[] memory bobCalls = new Call3[](1);
        bobCalls[0] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("delegate(address)", Constants.ALICE)
        });
        
        console.log("Bob delegating to Alice...");
        vm.startBroadcast(Constants.BOB_PRIVATE_KEY);
        (bool success1, ) = MULTICALL3.call(
            abi.encodeWithSignature("aggregate3((address,bool,bytes)[])", bobCalls)
        );
        vm.stopBroadcast();
        require(success1, "Bob delegation failed");
        
        // Charlie's delegations
        Call3[] memory charlieCalls = new Call3[](1);
        charlieCalls[0] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("delegate(address)", Constants.DAVID)
        });
        
        console.log("Charlie delegating to David...");
        vm.startBroadcast(Constants.CHARLIE_PRIVATE_KEY);
        (bool success2, ) = MULTICALL3.call(
            abi.encodeWithSignature("aggregate3((address,bool,bytes)[])", charlieCalls)
        );
        vm.stopBroadcast();
        require(success2, "Charlie delegation failed");
        
        console.log("Multicall3 Operation 2 completed!");
    }

    /**
     * @dev Execute multicall operation 3: Mixed transfers and delegation in one transaction
     */
    function runOperation3() public {
        console.log("=== Multicall3 Operation 3: Mixed transfers and delegation ===");
        
        // Prepare mixed calls (transfers + delegation from Alice)
        Call3[] memory calls = new Call3[](4);
        
        // Transfer 1: Alice to Bob (0.01 ENS) - using transferFrom
        calls[0] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.BOB, 0.01 ether)
        });
        
        // Transfer 2: Alice to Charlie (0.01 ENS) - using transferFrom
        calls[1] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.CHARLIE, 0.01 ether)
        });
        
        // Transfer 3: Alice to David (0.01 ENS) - using transferFrom
        calls[2] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.DAVID, 0.01 ether)
        });
        
        // Delegation: Alice delegates to Charlie
        calls[3] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("delegate(address)", Constants.CHARLIE)
        });
        
        console.log("Executing 3 transfers + 1 delegation in one transaction...");
        
        // Execute multicall
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        (bool success, bytes memory data) = MULTICALL3.call(
            abi.encodeWithSignature("aggregate3((address,bool,bytes)[])", calls)
        );
        vm.stopBroadcast();
        
        require(success, "Multicall3 operation 3 failed");
        console.log("Multicall3 Operation 3 completed!");
    }

    /**
     * @dev Execute multicall operation 4: Complex scenario with many operations
     */
    function runOperation4() public {
        console.log("=== Multicall3 Operation 4: Complex scenario with many operations ===");
        
        // Prepare many calls in one transaction
        Call3[] memory calls = new Call3[](6);
        
        // Multiple small transfers to trigger flags - using transferFrom
        calls[0] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.BOB, 0.01 ether)
        });
        
        calls[1] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.CHARLIE, 0.01 ether)
        });
        
        calls[2] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.DAVID, 0.01 ether)
        });
        
        calls[3] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.BOB, 0.01 ether)
        });
        
        calls[4] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("transferFrom(address,address,uint256)", Constants.ALICE, Constants.CHARLIE, 0.01 ether)
        });
        
        // Final delegation
        calls[5] = Call3({
            target: Constants.ENS_TOKEN_ADDRESS,
            allowFailure: false,
            callData: abi.encodeWithSignature("delegate(address)", Constants.DAVID)
        });
        
        console.log("Executing 5 transfers + 1 delegation in one transaction...");
        
        // Execute multicall
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        (bool success, bytes memory data) = MULTICALL3.call(
            abi.encodeWithSignature("aggregate3((address,bool,bytes)[])", calls)
        );
        vm.stopBroadcast();
        
        require(success, "Multicall3 operation 4 failed");
        console.log("Multicall3 Operation 4 completed!");
    }

    /**
     * @dev Run all multicall operations in sequence
     */
    function run() public {
        console.log("=== Starting All Multicall3 Operations ===");
        
        runOperation1();
        vm.roll(block.number + 1);
        
        runOperation2();
        vm.roll(block.number + 1);
        
        runOperation3();
        vm.roll(block.number + 1);
        
        runOperation4();
        vm.roll(block.number + 1);
        
        console.log("All Multicall3 operations completed successfully!");
        console.log("Created transactions with multiple transfers/delegations for flag testing!");
    }
}
