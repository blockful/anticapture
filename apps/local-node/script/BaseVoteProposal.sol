// apps/local-node/script/BaseVoteProposal.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title BaseVoteProposal
 * @dev Abstract base contract for voting on governance proposals
 *      Contains common functionality that specific voting scripts can inherit
 */
abstract contract BaseVoteProposal is BaseScript, Test {
    ENSGovernor internal ensGovernor;
    ENSToken internal ensToken;
    uint256 internal proposalId;

    // Struct to hold voting configuration
    struct VoterConfig {
        string name;
        uint256 privateKey;
        uint8 voteChoice;
    }

    // Abstract functions that must be implemented by child contracts
    function getProposalName() internal pure virtual returns (string memory);
    function getProposalTargets() internal pure virtual returns (address[] memory);
    function getProposalValues() internal pure virtual returns (uint256[] memory);
    function getProposalCalldatas() internal view virtual returns (bytes[] memory);
    function getProposalDescription() internal pure virtual returns (string memory);
    function getVoterConfigs() internal pure virtual returns (VoterConfig[] memory);
    function getNextScriptName() internal pure virtual returns (string memory);

    function run() public {
        console.log(string.concat("=== Voting on ", getProposalName(), " ==="));
        
        // Initialize contracts and calculate proposal ID
        initializeContracts();
        
        // Display pre-voting information
        displayProposalInfo();
        displayVoterInfo();
        
        // Validate pre-conditions
        validateVotingConditions();
        
        // Cast all votes
        castAllVotes();
        
        // Display results and next steps
        displayVotingResults();
        displayNextSteps();
    }
    
    /**
     * @dev Initialize contracts and calculate proposal ID
     */
    function initializeContracts() internal {
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();
        
        // Initialize contracts
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Calculate the proposal ID
        proposalId = calculateProposalId();
        
        console.log("Proposal ID:", proposalId);
        
        // Assert proposal ID is valid
        assertGt(proposalId, 0, "Proposal ID should be greater than zero");
    }
    
    /**
     * @dev Calculate the proposal ID using the same method as the creation script
     */
    function calculateProposalId() internal view returns (uint256) {
        address[] memory targets = getProposalTargets();
        uint256[] memory values = getProposalValues();
        bytes[] memory calldatas = getProposalCalldatas();
        bytes32 descriptionHash = keccak256(bytes(getProposalDescription()));
        
        return ensGovernor.hashProposal(targets, values, calldatas, descriptionHash);
    }
    
    /**
     * @dev Validate that voting conditions are met
     */
    function validateVotingConditions() internal view {
        VoterConfig[] memory voters = getVoterConfigs();
        
        // Assert voters have voting power before casting votes
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(voters[i].privateKey);
            assertGt(
                ensToken.getVotes(voterAddress), 
                0, 
                string.concat(voters[i].name, " must have voting power")
            );
        }
        
        // Assert proposal is in Active state (can be voted on)
        assertEq(uint8(ensGovernor.state(proposalId)), 1, "Proposal must be in Active state to vote");
    }
    
    /**
     * @dev Cast votes for all configured voters
     */
    function castAllVotes() internal {
        VoterConfig[] memory voters = getVoterConfigs();
        
        // Store initial vote counts
        (uint256 initialAgainst, uint256 initialFor, uint256 initialAbstain) = ensGovernor.proposalVotes(proposalId);
        
        // Cast votes from each account
        for (uint i = 0; i < voters.length; i++) {
            castVote(voters[i].name, voters[i].privateKey, voters[i].voteChoice);
        }
        
        // Validate all users have voted and vote counts increased
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(voters[i].privateKey);
            assert(ensGovernor.hasVoted(proposalId, voterAddress));
        }
        
        // Assert vote counts increased appropriately
        (uint256 finalAgainst, uint256 finalFor, uint256 finalAbstain) = ensGovernor.proposalVotes(proposalId);
        assertTrue(
            finalFor >= initialFor && finalAgainst >= initialAgainst && finalAbstain >= initialAbstain,
            "Vote counts should have increased"
        );
    }
    
    /**
     * @dev Display proposal information
     */
    function displayProposalInfo() internal view {
        console.log(string.concat("--- ", getProposalName(), " Information ---"));
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
        VoterConfig[] memory voters = getVoterConfigs();
        
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(voters[i].privateKey);
            console.log(
                string.concat(
                    voters[i].name, 
                    " - Voting Power: ", 
                    vm.toString(ensToken.getVotes(voterAddress) / 1e18),
                    " votes - Will vote ", 
                    getVoteString(voters[i].voteChoice)
                )
            );
        }
        console.log("");
    }
    
    /**
     * @dev Cast a vote on the proposal
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
        console.log(string.concat("--- Final Voting Results for ", getProposalName(), " ---"));
        
        // Get vote counts
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = ensGovernor.proposalVotes(proposalId);
        
        console.log("FOR votes:", forVotes / 1e18);
        console.log("AGAINST votes:", againstVotes / 1e18);
        console.log("ABSTAIN votes:", abstainVotes / 1e18);
        console.log("Total votes cast:", (forVotes + againstVotes + abstainVotes) / 1e18);
        
        // Check if voters have voted
        VoterConfig[] memory voters = getVoterConfigs();
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(voters[i].privateKey);
            console.log(
                string.concat(voters[i].name, " has voted: "),
                ensGovernor.hasVoted(proposalId, voterAddress)
            );
        }
        
        console.log("");
        console.log(string.concat("SUCCESS: All votes cast successfully on ", getProposalName(), "!"));
    }
    
    /**
     * @dev Display next steps instructions
     */
    function displayNextSteps() internal view {
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Skip blocks to end voting period: cast rpc anvil_mine 200 --rpc-url http://localhost:8545");
        console.log("2. Skip blocks for timelock delay: cast rpc anvil_mine 2 --rpc-url http://localhost:8545");
        console.log(string.concat("3. Run execution script: forge script script/", getNextScriptName(), " --rpc-url http://localhost:8545 --broadcast"));
    }
    
    /**
     * @dev Get address from private key (mapping known private keys)
     */
    function getAddressFromPrivateKey(uint256 privateKey) internal pure returns (address) {
        if (privateKey == Constants.ALICE_PRIVATE_KEY) return Constants.ALICE;
        if (privateKey == Constants.BOB_PRIVATE_KEY) return Constants.BOB;
        if (privateKey == Constants.CHARLIE_PRIVATE_KEY) return Constants.CHARLIE;
        if (privateKey == Constants.DAVID_PRIVATE_KEY) return Constants.DAVID;
        revert("Unknown private key");
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