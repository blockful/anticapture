// apps/indexer/contracts/script/CastVotes.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSGovernor} from "../src/ENSGovernor.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title CastVotes
 * @dev Script to cast votes on the governance proposal
 *      Replaces the cast send voting commands with proper Solidity script
 */
contract CastVotes is Script {
    ENSGovernor ensGovernor;
    ENSToken ensToken;
    uint256 proposalId;

    function run() public {
        console.log("=== Governance Voting Script ===");
        
        // Initialize contracts
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Calculate the proposal ID (same way as in entrypoint.sh)
        proposalId = calculateProposalId();
        
        console.log("Proposal ID:", proposalId);
        
        // Display pre-voting information
        displayProposalInfo();
        displayVoterInfo();
        
        // Cast votes from each account
        castAliceVote();    // Vote FOR
        castBobVote();      // Vote AGAINST  
        castCharlieVote();  // Vote ABSTAIN
        
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
     * @dev Alice votes FOR the proposal
     */
    function castAliceVote() internal {
        console.log("Alice casting vote FOR...");
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        ensGovernor.castVote(proposalId, Constants.FOR);
        vm.stopBroadcast();
        console.log("SUCCESS: Alice voted FOR");
    }
    
    /**
     * @dev Bob votes AGAINST the proposal
     */
    function castBobVote() internal {
        console.log("Bob casting vote AGAINST...");
        vm.startBroadcast(Constants.BOB_PRIVATE_KEY);
        ensGovernor.castVote(proposalId, Constants.AGAINST);
        vm.stopBroadcast();
        console.log("SUCCESS: Bob voted AGAINST");
    }
    
    /**
     * @dev Charlie votes ABSTAIN on the proposal
     */
    function castCharlieVote() internal {
        console.log("Charlie casting vote ABSTAIN...");
        vm.startBroadcast(Constants.CHARLIE_PRIVATE_KEY);
        ensGovernor.castVote(proposalId, Constants.ABSTAIN);
        vm.stopBroadcast();
        console.log("SUCCESS: Charlie voted ABSTAIN");
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
} 