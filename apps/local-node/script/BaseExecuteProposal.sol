// apps/local-node/script/BaseExecuteProposal.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "./Constants.sol";

/**
 * @title BaseExecuteProposal
 * @dev Abstract base contract for executing governance proposals
 *      Contains common functionality that specific execute scripts can inherit
 */
abstract contract BaseExecuteProposal is Script {
    
    // Abstract functions that must be implemented by child contracts
    function getProposalName() internal pure virtual returns (string memory);
    function getProposalTargets() internal pure virtual returns (address[] memory);
    function getProposalValues() internal pure virtual returns (uint256[] memory);
    function getProposalCalldatas() internal view virtual returns (bytes[] memory);
    function getProposalDescription() internal pure virtual returns (string memory);
    function getBeneficiaryAddress() internal pure virtual returns (address);
    function getBeneficiaryName() internal pure virtual returns (string memory);

    function run() external {
        console.log(string.concat("\n=== EXECUTING ", string(abi.encodePacked(getProposalName())), " ==="));
        console.log(string.concat("Executing: ", getProposalDescription()));
        
        // Load contract addresses
        address governor = Constants.ENS_GOVERNOR_ADDRESS;
        address ensToken = Constants.ENS_TOKEN_ADDRESS;
        address timelock = Constants.ENS_TIMELOCK_ADDRESS;
        address beneficiary = getBeneficiaryAddress();
        
        console.log("Governor:", governor);
        console.log("ENS Token:", ensToken);
        console.log("Timelock:", timelock);
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
        
        // Get beneficiary's balance before execution
        uint256 balanceBefore = IERC20(ensToken).balanceOf(beneficiary);
        console.log(string.concat(getBeneficiaryName(), "'s ENS balance before execution:"), balanceBefore / 1e18, "ENS");
        
        // Only execute if proposal is queued
        if (currentState == 5) {
            console.log("Proposal is queued! Executing...");
            
            // Execute the proposal
            vm.startBroadcast();
            IGovernor(governor).execute(targets, values, calldatas, descriptionHash);
            vm.stopBroadcast();
            
            console.log("\n=== EXECUTION RESULTS ===");
            
            // Verify execution
            uint8 finalState = IGovernor(governor).state(proposalId);
            console.log("Final proposal state:", finalState);
            
            uint256 balanceAfter = IERC20(ensToken).balanceOf(beneficiary);
            console.log(string.concat(getBeneficiaryName(), "'s ENS balance after execution:"), balanceAfter / 1e18, "ENS");
            console.log(string.concat("ENS transferred to ", getBeneficiaryName(), ":"), (balanceAfter - balanceBefore) / 1e18, "ENS");
            
            require(finalState == 7, "Proposal should be in Executed state");
            require(balanceAfter > balanceBefore, string.concat(getBeneficiaryName(), " should have received tokens"));
            
            console.log(string.concat(getProposalName(), " executed successfully!"));
            console.log(string.concat(getBeneficiaryName(), " received tokens"));
        } else if (currentState == 7) {
            console.log("Proposal already executed!");
        } else if (currentState == 3) {
            console.log("Proposal was defeated - cannot execute");
        } else if (currentState == 4) {
            console.log(string.concat("Proposal succeeded but not queued yet - run Queue", getProposalName(), " first"));
        } else {
            console.log("Unexpected proposal state:", currentState);
        }
    }
}

// Required interfaces
interface IGovernor {
    function execute(
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

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
} 