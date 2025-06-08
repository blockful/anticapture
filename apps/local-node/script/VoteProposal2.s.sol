// apps/local-node/script/VoteProposal2.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {BaseVoteProposal} from "./BaseVoteProposal.sol";
import {Constants} from "./Constants.sol";

/**
 * @title VoteProposal2
 * @dev Script to vote on the second governance proposal with mixed voting patterns
 *      Inherits from BaseVoteProposal for reusable functionality
 *      Part of the granular governance flow: Create -> Skip Blocks -> Vote -> Skip Blocks -> Execute
 */
contract VoteProposal2 is BaseVoteProposal {
    
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
    function getProposalCalldatas() internal view override returns (bytes[] memory) {
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ensToken.transfer.selector,
            Constants.CHARLIE,
            Constants.PROPOSAL_TOKEN_TRANSFER
        );
        return calldatas;
    }
    
    /**
     * @dev Returns the description for this proposal
     */
    function getProposalDescription() internal pure override returns (string memory) {
        return "Proposal 2: Transfer 5 ENS tokens to Charlie for development work";
    }
    
    /**
     * @dev Returns the voting configuration for this proposal - demonstrating mixed voting
     */
    function getVoterConfigs() internal pure override returns (VoterConfig[] memory) {
        VoterConfig[] memory voters = new VoterConfig[](3);
        voters[0] = VoterConfig("Alice", Constants.ALICE_PRIVATE_KEY, Constants.FOR);      // Alice votes FOR
        voters[1] = VoterConfig("Bob", Constants.BOB_PRIVATE_KEY, Constants.AGAINST);     // Bob votes AGAINST
        voters[2] = VoterConfig("Charlie", Constants.CHARLIE_PRIVATE_KEY, Constants.ABSTAIN); // Charlie abstains
        return voters;
    }
    
    /**
     * @dev Returns the name of the next script to run
     */
    function getNextScriptName() internal pure override returns (string memory) {
        return "ExecuteProposal2.s.sol";
    }
} 