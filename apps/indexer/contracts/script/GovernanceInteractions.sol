// apps/indexer/contracts/script/GovernanceInteractions.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title GovernanceInteractions
 * @dev Script to simulate real governance environment with token transfers, 
 *      proposal creation, voting, and execution
 */
contract GovernanceInteractions is Script {
    // Contract addresses (these should be set to deployed contract addresses)
    ENSToken public ensToken;
    ENSGovernor public ensGovernor;
    TimelockController public timelock;
    
    // Test addresses from Anvil
    address[] public testAddresses;
    
    // Proposal tracking
    uint256 public proposalId;
    
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
        
        console.log("=== Starting Governance Interactions Simulation ===");
        
        // Step 1: Transfer tokens to create a diverse token distribution
        transferTokens();
        
        // Step 1.5: Transfer tokens to timelock for governance proposals
        fundTimelock();
        
        // Step 2: Delegate voting power
        delegateVotingPower();
        
        // Step 3: Create a governance proposal
        createProposal();
        
        // Step 4: Vote on the proposal
        voteOnProposal();
        
        // Step 5: Execute the proposal (if it passes)
        executeProposal();
        
        console.log("=== Governance Interactions Simulation Complete ===");
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
        console.log("\n--- Step 1.5: Transferring Tokens to Timelock ---");
        
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
        console.log("\n--- Step 2: Delegating Voting Power ---");
        
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
        
        // Create many dummy transactions to advance blocks and establish voting power
        // We need to ensure voting power is recorded in blocks before proposal creation
        console.log("Advancing blocks to establish voting power for governance...");
        for (uint i = 0; i < 10; i++) {
            vm.startBroadcast(testAddresses[0]);
            // Make a small transfer to advance blocks
            ensToken.transfer(testAddresses[0], 0);
            vm.stopBroadcast();
            
            // Also make transfers from other addresses to create more blocks
            vm.startBroadcast(testAddresses[1]);
            ensToken.transfer(testAddresses[1], 0);
            vm.stopBroadcast();
        }
        
        console.log("Advanced 20 blocks to establish voting power");
        console.log("Alice's voting power after block advancement:", ensToken.getVotes(testAddresses[0]));
        
        // Check current block number
        console.log("Current block number:", block.number);
    }
    
    /**
     * @dev Creates a governance proposal
     */
    function createProposal() internal {
        console.log("\n--- Step 3: Creating Governance Proposal ---");
        
        // Check Alice's voting power before creating proposal
        uint256 aliceVotingPower = ensToken.getVotes(testAddresses[0]);
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        console.log("Alice's voting power:", aliceVotingPower);
        console.log("Proposal threshold:", proposalThreshold);
        
        if (aliceVotingPower < proposalThreshold) {
            console.log("ERROR: Alice doesn't have enough voting power to create proposal");
            return;
        }
        
        // Create a simple proposal to transfer some tokens from the timelock
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        // Proposal: Transfer 5 ENS tokens from timelock to Bob
        targets[0] = address(ensToken);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)", 
            testAddresses[1], // Bob
            5 ether // 5 ENS tokens
        );
        
        string memory description = "Proposal #1: Transfer 5 ENS tokens to Bob for community contribution";
        
        vm.startBroadcast(testAddresses[0]); // Alice creates the proposal
        proposalId = ensGovernor.propose(targets, values, calldatas, description);
        vm.stopBroadcast();
        
        console.log("Proposal created with ID:", proposalId);
        console.log("Proposal description:", description);
        console.log("Proposal state:", uint(ensGovernor.state(proposalId)));
        
        // Create dummy transactions to advance blocks for voting delay
        uint256 votingDelay = ensGovernor.votingDelay();
        console.log("Advancing", votingDelay + 1, "blocks for voting delay...");
        
        for (uint i = 0; i <= votingDelay; i++) {
            vm.startBroadcast(testAddresses[0]);
            // Make dummy transfers to advance blocks
            ensToken.transfer(testAddresses[0], 0);
            vm.stopBroadcast();
        }
        
        console.log("Voting delay completed. Proposal state:", uint(ensGovernor.state(proposalId)));
    }
    
    /**
     * @dev Simulates voting on the created proposal
     */
    function voteOnProposal() internal {
        console.log("\n--- Step 4: Voting on Proposal ---");
        
        // Check if proposal was created successfully
        if (proposalId == 0) {
            console.log("ERROR: No proposal to vote on");
            return;
        }
        
        console.log("Voting period started. Current proposal state:", uint(ensGovernor.state(proposalId)));
        
        // Different addresses vote with different choices
        // 0 = Against, 1 = For, 2 = Abstain
        
        // Alice votes FOR
        vm.startBroadcast(testAddresses[0]);
        ensGovernor.castVote(proposalId, 1);
        vm.stopBroadcast();
        console.log("Alice voted FOR the proposal");
        
        // Bob votes FOR  
        vm.startBroadcast(testAddresses[1]);
        ensGovernor.castVote(proposalId, 1);
        vm.stopBroadcast();
        console.log("Bob voted FOR the proposal");
        
        // David votes AGAINST
        vm.startBroadcast(testAddresses[3]);
        ensGovernor.castVote(proposalId, 0);
        vm.stopBroadcast();
        console.log("David voted AGAINST the proposal");
        
        // Check voting results
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = ensGovernor.proposalVotes(proposalId);
        console.log("Voting results:");
        console.log("For:", forVotes);
        console.log("Against:", againstVotes);
        console.log("Abstain:", abstainVotes);
        
        // Advance blocks to end voting period
        uint256 votingPeriod = ensGovernor.votingPeriod();
        console.log("Advancing", votingPeriod, "blocks to end voting period...");
        
        for (uint i = 0; i < votingPeriod; i++) {
            vm.startBroadcast(testAddresses[0]);
            // Make dummy transfers to advance blocks
            ensToken.transfer(testAddresses[0], 0);
            vm.stopBroadcast();
        }
    }
    
    /**
     * @dev Executes the proposal if it passes
     */
    function executeProposal() internal {
        console.log("\n--- Step 5: Executing Proposal ---");
        
        // Check if proposal was created successfully
        if (proposalId == 0) {
            console.log("ERROR: No proposal to execute");
            return;
        }
        
        console.log("Voting period ended. Final proposal state:", uint(ensGovernor.state(proposalId)));
        
        // Check if proposal succeeded
        if (ensGovernor.state(proposalId) == IGovernor.ProposalState.Succeeded) {
            console.log("Proposal SUCCEEDED! Proceeding with execution...");
            
            // Queue the proposal in timelock
            address[] memory targets = new address[](1);
            uint256[] memory values = new uint256[](1);
            bytes[] memory calldatas = new bytes[](1);
            
            targets[0] = address(ensToken);
            values[0] = 0;
            calldatas[0] = abi.encodeWithSignature(
                "transfer(address,uint256)", 
                testAddresses[1], // Bob
                5 ether
            );
            
            bytes32 descriptionHash = keccak256(bytes("Proposal #1: Transfer 5 ENS tokens to Bob for community contribution"));
            
            vm.startBroadcast(testAddresses[0]);
            ensGovernor.queue(targets, values, calldatas, descriptionHash);
            vm.stopBroadcast();
            
            console.log("Proposal queued in timelock");
            
            // Note: In a real environment, we would wait for the timelock delay
            // For this simulation, we'll skip execution since it requires time delay
            console.log("Proposal queued successfully. Execution would happen after timelock delay.");
            
        } else {
            console.log("Proposal FAILED or was DEFEATED");
        }
    }
    
    /**
     * @dev Helper function to set contract addresses after deployment
     */
    function setContractAddresses(
        address _ensToken,
        address _ensGovernor, 
        address _timelock
    ) external {
        ensToken = ENSToken(_ensToken);
        ensGovernor = ENSGovernor(payable(_ensGovernor));
        timelock = TimelockController(payable(_timelock));
        
        console.log("Contract addresses updated:");
        console.log("ENS Token:", address(ensToken));
        console.log("ENS Governor:", address(ensGovernor));
        console.log("Timelock:", address(timelock));
    }
    
    /**
     * @dev Helper function to display current governance state
     */
    function displayGovernanceState() external view {
        console.log("\n=== Current Governance State ===");
        console.log("Voting Delay:", ensGovernor.votingDelay(), "blocks");
        console.log("Voting Period:", ensGovernor.votingPeriod(), "blocks");
        console.log("Proposal Threshold:", ensGovernor.proposalThreshold());
        console.log("Quorum (current):", ensGovernor.quorum(block.number - 1));
        
        for (uint i = 0; i < testAddresses.length; i++) {
            console.log("Address", testAddresses[i]);
            console.log("  Token Balance:", ensToken.balanceOf(testAddresses[i]));
            console.log("  Voting Power:", ensToken.getVotes(testAddresses[i]));
        }
    }
} 