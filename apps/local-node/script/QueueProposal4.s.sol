// SPDX-License-Identifier: MIT
// apps/local-node/script/QueueProposal4.s.sol
pragma solidity ^0.8.19;

import {BaseQueueProposal} from "./BaseQueueProposal.sol";
import {Constants} from "./Constants.sol";

/**
 * @title QueueProposal4
 * @dev Script to queue Proposal 4 (Transfer 3 ENS to Alice) after it succeeds
 * Inherits from BaseQueueProposal for reusable functionality
 * NOTE: This proposal will likely be defeated due to all AGAINST votes
 */
contract QueueProposal4 is BaseQueueProposal {
    
    /**
     * @dev Returns the name of this proposal
     */
    function getProposalName() internal pure override returns (string memory) {
        return "Proposal 4";
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
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", Constants.ALICE, 3 ether);
        return calldatas;
    }
    
    /**
     * @dev Returns the description for this proposal
     */
    function getProposalDescription() internal pure override returns (string memory) {
        return "Proposal 4: Transfer 3 ENS tokens to Alice as performance bonus";
    }
    
    /**
     * @dev Returns the beneficiary address
     */
    function getBeneficiaryAddress() internal pure override returns (address) {
        return Constants.ALICE;
    }
    
    /**
     * @dev Returns the beneficiary name
     */
    function getBeneficiaryName() internal pure override returns (string memory) {
        return "Alice";
    }
} 