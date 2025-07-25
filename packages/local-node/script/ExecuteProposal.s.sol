// apps/local-node/script/ExecuteProposal.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title ExecuteProposal
 * @dev Parameterized script to execute governance proposals
 *      Usage: forge script script/ExecuteProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal Name" 0x... 1000000000000000000 "Description"
 */
contract ExecuteProposal is BaseScript, Test {
    ENSGovernor internal ensGovernor;
    ENSToken internal ensToken;
    uint256 internal proposalId;

    struct ProposalParams {
        string name;
        address recipient;
        uint256 amount;
        string description;
    }

    ProposalParams private proposalParams;

    function run(
        string memory _proposalName,
        address _recipient,
        uint256 _amount,
        string memory _description
    ) public {
        proposalParams = ProposalParams(
            _proposalName,
            _recipient,
            _amount,
            _description
        );

        console.log(
            string.concat("=== Executing ", proposalParams.name, " ===")
        );

        // Initialize contracts
        labelAddresses();
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);

        // Calculate proposal ID
        address[] memory targets = new address[](1);
        targets[0] = Constants.ENS_TOKEN_ADDRESS;
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            proposalParams.recipient,
            proposalParams.amount
        );
        bytes32 descriptionHash = keccak256(bytes(proposalParams.description));

        proposalId = ensGovernor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );
        console.log("Proposal ID:", proposalId);

        // Validate proposal is in Queued state
        assertEq(
            uint8(ensGovernor.state(proposalId)),
            5,
            "Proposal must be in Queued state to execute"
        );

        // Get recipient balance before
        uint256 balanceBefore = ensToken.balanceOf(proposalParams.recipient);
        console.log("Recipient balance before:", balanceBefore / 1e18, "ENS");

        // Execute the proposal
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        ensGovernor.execute(targets, values, calldatas, descriptionHash);
        vm.stopBroadcast();

        // Get recipient balance after
        uint256 balanceAfter = ensToken.balanceOf(proposalParams.recipient);
        console.log("Recipient balance after:", balanceAfter / 1e18, "ENS");
        console.log(
            "Tokens transferred:",
            (balanceAfter - balanceBefore) / 1e18,
            "ENS"
        );

        console.log(
            string.concat(
                "SUCCESS: ",
                proposalParams.name,
                " executed successfully!"
            )
        );
    }
}
