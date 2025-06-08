// apps/local-node/script/BaseCreateProposal.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title BaseCreateProposal
 * @dev Abstract base contract for creating governance proposals
 *      Contains common functionality that specific proposal scripts can inherit
 */
abstract contract BaseCreateProposal is BaseScript, Test {
    ENSGovernor internal ensGovernor;
    ENSToken internal ensToken;

    // Abstract functions that must be implemented by child contracts
    function getProposalName() internal pure virtual returns (string memory);
    function getProposalTargets() internal pure virtual returns (address[] memory);
    function getProposalValues() internal pure virtual returns (uint256[] memory);
    function getProposalCalldatas() internal view virtual returns (bytes[] memory);
    function getProposalDescription() internal pure virtual returns (string memory);
    function getNextScriptName() internal pure virtual returns (string memory);

    function run() public {
        console.log(string.concat("=== Creating ", getProposalName(), " ==="));
        
        // Initialize contracts and setup
        initializeContracts();
        
        // Display proposal creator info
        displayProposerInfo();
        
        // Validate proposer has enough voting power
        validateProposer();
        
        // Get proposal parameters
        address[] memory targets = getProposalTargets();
        uint256[] memory values = getProposalValues();
        bytes[] memory calldatas = getProposalCalldatas();
        string memory description = getProposalDescription();
        
        // Display proposal details
        displayProposalDetails(targets, values, calldatas, description);
        
        // Create the proposal
        uint256 proposalId = createProposal(targets, values, calldatas, description);
        
        // Display results and next steps
        displayCreationResults(proposalId);
        displayNextSteps();
    }
    
    /**
     * @dev Initialize contracts and label addresses
     */
    function initializeContracts() internal {
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();
        
        // Initialize contracts
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
    }
    
    /**
     * @dev Validate that the proposer has enough voting power
     */
    function validateProposer() internal view {
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        assertGe(
            ensToken.getVotes(Constants.ALICE), 
            proposalThreshold, 
            "Alice must have enough voting power to create proposals"
        );
    }
    
    /**
     * @dev Create the governance proposal
     */
    function createProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) internal returns (uint256 proposalId) {
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        
        proposalId = ensGovernor.propose(targets, values, calldatas, description);
        
        vm.stopBroadcast();
        
        // Assert proposal was created successfully
        assertGt(proposalId, 0, "Proposal ID should be greater than zero");
        
        return proposalId;
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
    ) internal view {
        console.log(string.concat("--- ", getProposalName(), " Details ---"));
        console.log("Target Contract:", targets[0]);
        console.log("ETH Value:", values[0]);
        console.log("Description:", description);
        
        // Log additional details if function selector is a transfer
        if (calldatas.length > 0 && calldatas[0].length >= 4) {
            bytes4 selector = bytes4(calldatas[0]);
            if (selector == ensToken.transfer.selector) {
                console.log("Function: transfer(address,uint256)");
                // Extract the parameters by copying to a new bytes array
                bytes memory calldata_ = calldatas[0];
                bytes memory parameters = new bytes(calldata_.length - 4);
                for (uint i = 0; i < parameters.length; i++) {
                    parameters[i] = calldata_[i + 4];
                }
                // Decode the recipient and amount from parameters
                (address recipient, uint256 amount) = abi.decode(parameters, (address, uint256));
                console.log("Recipient:", recipient);
                console.log("Amount:", amount / 1e18, "ENS tokens");
            }
        }
        console.log("");
    }
    
    /**
     * @dev Display creation results
     */
    function displayCreationResults(uint256 proposalId) internal view {
        console.log(string.concat("SUCCESS: ", getProposalName(), " created!"));
        console.log("Proposal ID:", proposalId);
        
        // Display post-creation info
        displayProposalState(proposalId);
        
        // Assert proposal is in Pending state initially
        assertEq(uint8(ensGovernor.state(proposalId)), 0, "Proposal should be in Pending state initially");
    }
    
    /**
     * @dev Display next steps instructions
     */
    function displayNextSteps() internal view {
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Skip blocks to make proposal active: cast rpc anvil_mine 2 --rpc-url http://localhost:8545");
        console.log(string.concat("2. Run voting script: forge script script/", getNextScriptName(), " --rpc-url http://localhost:8545 --broadcast"));
    }
    
    /**
     * @dev Display the state of the proposal
     */
    function displayProposalState(uint256 proposalId) internal view {
        console.log(string.concat("--- ", getProposalName(), " Status ---"));
        uint8 state = uint8(ensGovernor.state(proposalId));
        console.log("Proposal State:", getStateName(state));
        console.log("Voting starts at block:", ensGovernor.proposalSnapshot(proposalId));
        console.log("Voting ends at block:", ensGovernor.proposalDeadline(proposalId));
        console.log("Current block:", block.number);
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