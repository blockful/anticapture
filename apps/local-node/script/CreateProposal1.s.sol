// apps/local-node/script/CreateProposal1.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {BaseCreateProposal} from "./BaseCreateProposal.sol";
import {Constants} from "./Constants.sol";

/**
 * @title CreateProposal1
 * @dev Script to create the first governance proposal
 *      Inherits from BaseCreateProposal for reusable functionality
 *      Part of the granular governance flow: Create -> Skip Blocks -> Vote -> Skip Blocks -> Execute
 */
contract CreateProposal1 is BaseCreateProposal {
    
    /**
     * @dev Returns the name of this proposal
     */
    function getProposalName() internal pure override returns (string memory) {
        return "Proposal 1";
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
        values[0] = 0; // No ETH being sent
        return values;
    }
    
    /**
     * @dev Returns the calldata for this proposal
     */
    function getProposalCalldatas() internal view override returns (bytes[] memory) {
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ensToken.transfer.selector,
            Constants.BOB,
            Constants.PROPOSAL_TOKEN_TRANSFER
        );
        return calldatas;
    }
    
    /**
     * @dev Returns the description for this proposal
     */
    function getProposalDescription() internal pure override returns (string memory) {
        return "Proposal 1: Transfer 5 ENS tokens to Bob for community contribution";
    }
    
    /**
     * @dev Returns the name of the next script to run
     */
    function getNextScriptName() internal pure override returns (string memory) {
        return "VoteProposal1.s.sol";
    }
} 