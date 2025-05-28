// apps/indexer/contracts/script/GovernanceProposal.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title GovernanceProposal
 * @dev Script to create and execute governance proposals
 */
contract GovernanceProposal is Script {
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
        
        console.log("=== Starting Governance Proposal ===");
        
        // Step 1: Create a governance proposal
        createProposal();
        
        // Step 2: Vote on the proposal
        voteOnProposal();
        
        // Step 3: Execute the proposal (if it passes)
        executeProposal();
        
        console.log("=== Governance Proposal Complete ===");
    }
    
    /**
     * @dev Creates a governance proposal
     */
    function createProposal() internal {
        console.log("\n--- Step 1: Creating Governance Proposal ---");
        
        // Check Alice's voting power before creating proposal
        uint256 aliceVotingPower = ensToken.getVotes(testAddresses[0]);
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        console.log("Alice's voting power:", aliceVotingPower);
        console.log("Proposal threshold:", proposalThreshold);
        console.log("Current block number:", block.number);
        
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
        console.log("\n--- Step 2: Voting on Proposal ---");
        
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
        console.log("\n--- Step 3: Executing Proposal ---");
        
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
            console.log("Proposal queued successfully. Execution would happen after timelock delay.");
            
        } else {
            console.log("Proposal FAILED or was DEFEATED");
        }
    }
} 