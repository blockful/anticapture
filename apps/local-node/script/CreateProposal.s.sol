// apps/indexer/contracts/script/CreateProposal.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSGovernor} from "../src/ENSGovernor.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title CreateProposal
 * @dev Script to create a governance proposal for transferring ENS tokens
 *      Replaces the cast send proposal creation command
 */
contract CreateProposal is Script {
    ENSGovernor ensGovernor;
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
        console.log("=== Governance Proposal Creation Script ===");
        
        // Label addresses for better readability in logs
        labelAddresses();
        
        // Initialize contracts
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Display proposal creator info
        displayProposerInfo();
        
        // Prepare proposal parameters
        address[] memory targets = new address[](1);
        targets[0] = Constants.ENS_TOKEN_ADDRESS;
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0; // No ETH being sent
        
        bytes[] memory calldatas = new bytes[](1);
        // Encode the transfer(address,uint256) function call: transfer 5 ENS to Bob
        calldatas[0] = abi.encodeWithSelector(
            ensToken.transfer.selector,
            Constants.BOB,
            Constants.PROPOSAL_TOKEN_TRANSFER
        );
        
        string memory description = "Transfer 5 ENS tokens to Bob for community contribution";
        
        // Display proposal details
        displayProposalDetails(targets, values, calldatas, description);
        
        // Create the proposal
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        
        uint256 proposalId = ensGovernor.propose(
            targets,
            values,
            calldatas,
            description
        );
        
        vm.stopBroadcast();
        
        console.log("SUCCESS: Proposal created!");
        console.log("Proposal ID:", proposalId);
        
        // Display post-creation info
        displayProposalState(proposalId);
    }
    
    /**
     * @dev Display information about the proposal creator
     */
    function displayProposerInfo() internal view {
        console.log("--- Proposer Information ---");
        console.log("Proposer: Alice");
        console.log("Proposer Address:", Constants.ALICE);
        console.log("Voting Power:", ensToken.getVotes(Constants.ALICE) / 1e18, "votes");
        console.log("Proposal Threshold:", ensGovernor.proposalThreshold() / 1e18, "votes required");
        console.log("");
    }
    
    /**
     * @dev Display the details of the proposal being created
     */
    function displayProposalDetails(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) internal pure {
        console.log("--- Proposal Details ---");
        console.log("Target Contract:", targets[0]);
        console.log("ETH Value:", values[0]);
        console.log("Function: transfer(address,uint256)");
        console.log("Recipient:", Constants.BOB);
        console.log("Amount: 5 ENS tokens");
        console.log("Description:", description);
        console.log("");
    }
    
    /**
     * @dev Display the state of the newly created proposal
     */
    function displayProposalState(uint256 proposalId) internal view {
        console.log("--- Proposal Status ---");
        uint8 state = uint8(ensGovernor.state(proposalId));
        console.log("Proposal State:", getStateName(state));
        console.log("Voting starts at block:", ensGovernor.proposalSnapshot(proposalId));
        console.log("Voting ends at block:", ensGovernor.proposalDeadline(proposalId));
        console.log("");
    }
    
    /**
     * @dev Convert proposal state enum to readable string
     */
    function getStateName(uint8 state) internal pure returns (string memory) {
        if (state == 0) return "Pending";
        if (state == 1) return "Active";
        if (state == 2) return "Canceled";
        if (state == 3) return "Defeated";
        if (state == 4) return "Succeeded";
        if (state == 5) return "Queued";
        if (state == 6) return "Expired";
        if (state == 7) return "Executed";
        return "Unknown";
    }
} 