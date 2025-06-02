// apps/indexer/contracts/script/CastVotes.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title CastVotes
 * @dev Script to cast votes on the governance proposal
 *      Replaces the cast send voting commands with proper Solidity script
 */
contract CastVotes is BaseScript, Test {
    ENSGovernor ensGovernor;
    ENSToken ensToken;
    uint256 proposalId;

    function run() public {
        console.log("=== Governance Voting Script ===");
        
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();
        
        // Initialize contracts
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Calculate the proposal ID (same way as in entrypoint.sh)
        proposalId = calculateProposalId();
        
        console.log("Proposal ID:", proposalId);
        
        // Assert proposal ID is valid
        assertGt(proposalId, 0, "Proposal ID should be greater than zero");
        
        // Display pre-voting information
        displayProposalInfo();
        displayVoterInfo();
        
        // Assert voters have voting power before casting votes
        assertGt(ensToken.getVotes(Constants.ALICE), 0, "Alice must have voting power");
        assertGt(ensToken.getVotes(Constants.BOB), 0, "Bob must have voting power");
        assertGt(ensToken.getVotes(Constants.CHARLIE), 0, "Charlie must have voting power");
        
        // Assert proposal is in Active state (can be voted on)
        assertEq(uint8(ensGovernor.state(proposalId)), 1, "Proposal must be in Active state to vote");
        
        // Store initial vote counts
        (uint256 initialAgainst, uint256 initialFor, uint256 initialAbstain) = ensGovernor.proposalVotes(proposalId);
        
        // Cast votes from each account
        castVote("Alice", Constants.ALICE_PRIVATE_KEY, Constants.FOR);      // Vote FOR
        castVote("Bob", Constants.BOB_PRIVATE_KEY, Constants.AGAINST);      // Vote AGAINST  
        castVote("Charlie", Constants.CHARLIE_PRIVATE_KEY, Constants.ABSTAIN); // Vote ABSTAIN
        
        // Assert all users have voted
        assert(ensGovernor.hasVoted(proposalId, Constants.ALICE));
        assert(ensGovernor.hasVoted(proposalId, Constants.BOB));
        assert(ensGovernor.hasVoted(proposalId, Constants.CHARLIE));
        
        // Assert vote counts increased appropriately
        (uint256 finalAgainst, uint256 finalFor, uint256 finalAbstain) = ensGovernor.proposalVotes(proposalId);
        assertGt(finalFor, initialFor, "FOR votes should have increased");
        assertGt(finalAgainst, initialAgainst, "AGAINST votes should have increased");
        assertGt(finalAbstain, initialAbstain, "ABSTAIN votes should have increased");
        
        // Display final voting results
        displayVotingResults();
        
        console.log("SUCCESS: All votes cast successfully!");
    }
    
    /**
     * @dev Calculate the proposal ID using the same method as entrypoint.sh
     */
    function calculateProposalId() internal view returns (uint256) {
        // Prepare proposal parameters (same as CreateProposal.s.sol)
        address[] memory targets = new address[](1);
        targets[0] = Constants.ENS_TOKEN_ADDRESS;
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ensToken.transfer.selector,
            Constants.BOB,
            Constants.PROPOSAL_TOKEN_TRANSFER
        );
        
        bytes32 descriptionHash = keccak256(bytes("Transfer 5 ENS tokens to Bob for community contribution"));
        
        return ensGovernor.hashProposal(targets, values, calldatas, descriptionHash);
    }
    
    /**
     * @dev Display proposal information
     */
    function displayProposalInfo() internal view {
        console.log("--- Proposal Information ---");
        uint8 state = uint8(ensGovernor.state(proposalId));
        console.log("Proposal State:", getStateName(state));
        console.log("Voting Period: Block", ensGovernor.proposalSnapshot(proposalId), "to", ensGovernor.proposalDeadline(proposalId));
        console.log("Current Block:", block.number);
        console.log("");
    }
    
    /**
     * @dev Display voter information before voting
     */
    function displayVoterInfo() internal view {
        console.log("--- Voter Information ---");
        console.log("Alice - Voting Power:", ensToken.getVotes(Constants.ALICE) / 1e18, "votes - Will vote FOR");
        console.log("Bob - Voting Power:", ensToken.getVotes(Constants.BOB) / 1e18, "votes - Will vote AGAINST");
        console.log("Charlie - Voting Power:", ensToken.getVotes(Constants.CHARLIE) / 1e18, "votes - Will vote ABSTAIN");
        console.log("");
    }
    
    /**
     * @dev Cast a vote on the proposal
     * @param voterName Human-readable name of the voter for logging
     * @param privateKey Private key of the voter
     * @param voteChoice Vote choice (FOR, AGAINST, or ABSTAIN)
     */
    function castVote(string memory voterName, uint256 privateKey, uint8 voteChoice) internal {
        string memory voteString = getVoteString(voteChoice);
        console.log(string.concat(voterName, " casting vote ", voteString, "..."));
        
        vm.startBroadcast(privateKey);
        ensGovernor.castVote(proposalId, voteChoice);
        vm.stopBroadcast();
        
        console.log(string.concat("SUCCESS: ", voterName, " voted ", voteString));
    }
    
    /**
     * @dev Display final voting results
     */
    function displayVotingResults() internal view {
        console.log("--- Final Voting Results ---");
        
        // Get vote counts
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = ensGovernor.proposalVotes(proposalId);
        
        console.log("FOR votes:", forVotes / 1e18);
        console.log("AGAINST votes:", againstVotes / 1e18);
        console.log("ABSTAIN votes:", abstainVotes / 1e18);
        console.log("Total votes cast:", (forVotes + againstVotes + abstainVotes) / 1e18);
        
        // Check if Alice has voted
        console.log("Alice has voted:", ensGovernor.hasVoted(proposalId, Constants.ALICE));
        console.log("Bob has voted:", ensGovernor.hasVoted(proposalId, Constants.BOB));
        console.log("Charlie has voted:", ensGovernor.hasVoted(proposalId, Constants.CHARLIE));
        
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
    
    /**
     * @dev Convert vote choice to readable string
     */
    function getVoteString(uint8 voteChoice) internal pure returns (string memory) {
        if (voteChoice == Constants.FOR) return "FOR";
        if (voteChoice == Constants.AGAINST) return "AGAINST";
        if (voteChoice == Constants.ABSTAIN) return "ABSTAIN";
        return "UNKNOWN";
    }
} 