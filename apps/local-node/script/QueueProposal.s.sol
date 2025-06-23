// apps/local-node/script/QueueProposal.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title QueueProposal
 * @dev Parameterized script to queue governance proposals
 *      Usage: forge script script/QueueProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal Name" 0x... 1000000000000000000 "Description"
 */
contract QueueProposal is BaseScript, Test {
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

        console.log(string.concat("=== Queuing ", proposalParams.name, " ==="));

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

        // Validate proposal is in Succeeded state
        assertEq(
            uint8(ensGovernor.state(proposalId)),
            4,
            "Proposal must be in Succeeded state to queue"
        );

        // Queue the proposal
        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);
        ensGovernor.queue(targets, values, calldatas, descriptionHash);
        vm.stopBroadcast();

        console.log(
            string.concat("SUCCESS: ", proposalParams.name, " queued!")
        );
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Wait for timelock delay to pass");
        console.log("2. Run execute script with parameters:");
        console.log(
            string.concat(
                '   forge script script/ExecuteProposal.s.sol --sig "run(string,address,uint256,string)" "',
                proposalParams.name,
                '" ',
                vm.toString(proposalParams.recipient),
                " ",
                vm.toString(proposalParams.amount),
                ' "',
                proposalParams.description,
                '" --rpc-url http://localhost:8545 --broadcast'
            )
        );
    }
}
