// SPDX-License-Identifier: MIT
// apps/local-node/script/QueueProposal3.s.sol
pragma solidity ^0.8.19;

import {BaseQueueProposal} from "./BaseQueueProposal.sol";
import {Constants} from "./Constants.sol";

/**
 * @title QueueProposal3
 * @dev Script to queue Proposal 3 (Transfer 5 ENS to David) after it succeeds
 * Inherits from BaseQueueProposal for reusable functionality
 */
contract QueueProposal3 is BaseQueueProposal {
    
    /**
     * @dev Returns the name of this proposal
     */
    function getProposalName() internal pure override returns (string memory) {
        return "Proposal 3";
    }
    
    /**
     * @dev Returns the target contracts for this proposal
     */
    function getProposalTargets() internal pure override returns (address[] memory) {
        address[] memory targets = new address[](1);
        targets[0] = Constants.ENS_TOKEN_ADDRESS;
        return targets;
    }
    
    /**
     * @dev Returns the ETH values for this proposal
     */
    function getProposalValues() internal pure override returns (uint256[] memory) {
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        return values;
    }
    
    /**
     * @dev Returns the calldata for this proposal
     */
    function getProposalCalldatas() internal pure override returns (bytes[] memory) {
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", Constants.DAVID, 5 ether);
        return calldatas;
    }
    
    /**
     * @dev Returns the description for this proposal
     */
    function getProposalDescription() internal pure override returns (string memory) {
        return "Proposal 3: Transfer 5 ENS tokens to David for testing work";
    }
    
    /**
     * @dev Returns the beneficiary address
     */
    function getBeneficiaryAddress() internal pure override returns (address) {
        return Constants.DAVID;
    }
    
    /**
     * @dev Returns the beneficiary name
     */
    function getBeneficiaryName() internal pure override returns (string memory) {
        return "David";
    }
} 