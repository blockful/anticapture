// SPDX-License-Identifier: MIT
// apps/local-node/script/ExecuteProposal2.s.sol
pragma solidity ^0.8.19;

import {BaseExecuteProposal} from "./BaseExecuteProposal.sol";
import {Constants} from "./Constants.sol";

/**
 * @title ExecuteProposal2
 * @dev Script to execute Proposal 2 (Transfer 5 ENS to Charlie) after it's queued
 * Inherits from BaseExecuteProposal for reusable functionality
 */
contract ExecuteProposal2 is BaseExecuteProposal {
    
    /**
     * @dev Returns the name of this proposal
     */
    function getProposalName() internal pure override returns (string memory) {
        return "Proposal 2";
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
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", Constants.CHARLIE, 5 ether);
        return calldatas;
    }
    
    /**
     * @dev Returns the description for this proposal
     */
    function getProposalDescription() internal pure override returns (string memory) {
        return "Proposal 2: Transfer 5 ENS tokens to Charlie for development work";
    }
    
    /**
     * @dev Returns the beneficiary address
     */
    function getBeneficiaryAddress() internal pure override returns (address) {
        return Constants.CHARLIE;
    }
    
    /**
     * @dev Returns the beneficiary name
     */
    function getBeneficiaryName() internal pure override returns (string memory) {
        return "Charlie";
    }
} 