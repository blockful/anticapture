// apps/indexer/contracts/script/GovernanceSetup.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";

/**
 * @title GovernanceSetup
 * @dev Script to set up governance environment with token distribution and delegation
 */
contract GovernanceSetup is Script {
    // Contract addresses (these should be set to deployed contract addresses)
    ENSToken public ensToken;
    ENSGovernor public ensGovernor;
    TimelockController public timelock;
    
    // Test addresses from Anvil
    address[] public testAddresses;
    
    function setUp() public {
        // Initialize test addresses (Anvil default addresses)
        testAddresses = new address[](4);
        testAddresses[0] = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266); // Alice
        testAddresses[1] = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8); // Bob  
        testAddresses[2] = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC); // Charlie
        testAddresses[3] = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906); // David
        
        // Set deployed contract addresses
        ensToken = ENSToken(0x5FbDB2315678afecb367f032d93F642f64180aa3);
        ensGovernor = ENSGovernor(payable(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0));
        timelock = TimelockController(payable(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512));
    }
    
    function run() external {
        setUp();
        
        console.log("=== Starting Governance Setup ===");
        
        // Step 1: Transfer tokens to create a diverse token distribution
        transferTokens();
        
        // Step 2: Transfer tokens to timelock for governance proposals
        fundTimelock();
        
        // Step 3: Delegate voting power
        delegateVotingPower();
        
        console.log("=== Governance Setup Complete ===");
    }
    
    /**
     * @dev Transfers tokens between addresses to simulate real token distribution
     */
    function transferTokens() internal {
        console.log("\n--- Step 1: Transferring Tokens ---");
        
        vm.startBroadcast(testAddresses[0]); // Alice broadcasts
        
        // Alice transfers tokens to other addresses
        uint256 transferAmount = 10 ether; // 10 ENS tokens
        
        for (uint i = 1; i < testAddresses.length; i++) {
            if (ensToken.balanceOf(testAddresses[0]) >= transferAmount) {
                ensToken.transfer(testAddresses[i], transferAmount);
                console.log("Transferred", transferAmount, "ENS from Alice to address", testAddresses[i]);
            }
        }
        
        vm.stopBroadcast();
        
        // Display balances
        console.log("\nToken Balances after transfers:");
        for (uint i = 0; i < testAddresses.length; i++) {
            console.log("Address", testAddresses[i], "balance:", ensToken.balanceOf(testAddresses[i]));
        }
    }
    
    /**
     * @dev Transfers tokens to timelock for governance proposals
     */
    function fundTimelock() internal {
        console.log("\n--- Step 2: Transferring Tokens to Timelock ---");
        
        vm.startBroadcast(testAddresses[0]); // Alice broadcasts
        
        // Alice transfers tokens to timelock
        uint256 transferAmount = 5 ether; // 5 ENS tokens
        ensToken.transfer(address(timelock), transferAmount);
        
        console.log("Transferred", transferAmount, "ENS to timelock");
        
        vm.stopBroadcast();
        
        // Display timelock balance
        console.log("Timelock balance:", ensToken.balanceOf(address(timelock)));
    }
    
    /**
     * @dev Delegates voting power to create an active governance environment
     */
    function delegateVotingPower() internal {
        console.log("\n--- Step 3: Delegating Voting Power ---");
        
        // Each address delegates to themselves to activate voting power
        for (uint i = 0; i < testAddresses.length; i++) {
            vm.startBroadcast(testAddresses[i]);
            ensToken.delegate(testAddresses[i]);
            vm.stopBroadcast();
            
            console.log("Address", testAddresses[i], "delegated to themselves");
            console.log("Voting power:", ensToken.getVotes(testAddresses[i]));
        }
        
        // Some addresses delegate to others to simulate delegation patterns
        vm.startBroadcast(testAddresses[2]); // Charlie
        ensToken.delegate(testAddresses[0]); // Delegates to Alice
        vm.stopBroadcast();
        console.log("Charlie delegated voting power to Alice");
        console.log("Alice's new voting power:", ensToken.getVotes(testAddresses[0]));
        
        console.log("Current block number:", block.number);
    }
} 