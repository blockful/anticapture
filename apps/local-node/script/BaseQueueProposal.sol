// apps/local-node/script/BaseQueueProposal.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "./Constants.sol";

/**
 * @title BaseQueueProposal
 * @dev Abstract base contract for queuing governance proposals
 *      Contains common functionality that specific queue scripts can inherit
 */
abstract contract BaseQueueProposal is Script {
    
    // Abstract functions that must be implemented by child contracts
    function getProposalName() internal pure virtual returns (string memory);
    function getProposalTargets() internal pure virtual returns (address[] memory);
    function getProposalValues() internal pure virtual returns (uint256[] memory);
    function getProposalCalldatas() internal view virtual returns (bytes[] memory);
    function getProposalDescription() internal pure virtual returns (string memory);
    function getBeneficiaryAddress() internal pure virtual returns (address);
    function getBeneficiaryName() internal pure virtual returns (string memory);

    function run() external {
        console.log(string.concat("\n=== QUEUING ", string(abi.encodePacked(getProposalName())), " ==="));
        console.log(string.concat("Queuing: ", getProposalDescription()));
        
        // Load contract addresses
        address governor = Constants.ENS_GOVERNOR_ADDRESS;
        address ensToken = Constants.ENS_TOKEN_ADDRESS;
        address beneficiary = getBeneficiaryAddress();
        
        console.log("Governor:", governor);
        console.log("ENS Token:", ensToken);
        console.log(string.concat("Beneficiary (", getBeneficiaryName(), "):"), beneficiary);
        
        // Build proposal data (must match Create script exactly)
        address[] memory targets = getProposalTargets();
        uint256[] memory values = getProposalValues();
        bytes[] memory calldatas = getProposalCalldatas();
        string memory description = getProposalDescription();
        
        // Generate proposal ID
        bytes32 descriptionHash = keccak256(bytes(description));
        uint256 proposalId = IGovernor(governor).hashProposal(targets, values, calldatas, descriptionHash);
        
        console.log("Proposal ID:", proposalId);
        
        // Check current proposal state
        uint8 currentState = IGovernor(governor).state(proposalId);
        console.log("Current proposal state:", currentState);
        console.log("State meanings: 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed");
        
        // Only queue if proposal succeeded
        if (currentState == 4) {
            console.log("Proposal succeeded! Queuing for execution...");
            
            // Queue the proposal
            vm.startBroadcast();
            IGovernor(governor).queue(targets, values, calldatas, descriptionHash);
            vm.stopBroadcast();
            
            // Verify queuing
            uint8 newState = IGovernor(governor).state(proposalId);
            console.log("New proposal state after queuing:", newState);
            
            require(newState == 5, "Proposal should be in Queued state");
            console.log(string.concat(getProposalName(), " queued successfully!"));
            console.log("Next step: Wait for timelock delay, then execute proposal");
        } else if (currentState == 5) {
            console.log("Proposal already queued!");
        } else if (currentState == 3) {
            console.log("Proposal was defeated - cannot queue");
        } else {
            console.log("Unexpected proposal state:", currentState);
        }
    }
}

// Required interfaces
interface IGovernor {
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256);
    
    function state(uint256 proposalId) external view returns (uint8);
    
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external pure returns (uint256);
} 