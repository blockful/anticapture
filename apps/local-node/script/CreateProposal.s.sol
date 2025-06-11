// apps/local-node/script/CreateProposal.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title CreateProposal
 * @dev Parameterized script to create governance proposals
 *      Usage: forge script script/CreateProposal.s.sol --sig "run(string,address,uint256,string)" "Proposal Name" 0x... 1000000000000000000 "Description"
 */
contract CreateProposal is BaseScript, Test {
    ENSGovernor internal ensGovernor;
    ENSToken internal ensToken;

    struct ProposalParams {
        string name;
        address recipient;
        uint256 amount;
        string description;
    }

    ProposalParams private proposalParams;

    /**
     * @dev Parameterized run function that accepts proposal details
     * @param _proposalName Name of the proposal (e.g., "Proposal 1")
     * @param _recipient Address to receive the ENS tokens
     * @param _amount Amount of ENS tokens to transfer (in wei)
     * @param _description Full description of the proposal
     */
    function run(
        string memory _proposalName,
        address _recipient,
        uint256 _amount,
        string memory _description
    ) public {
        // Set parameters
        proposalParams = ProposalParams(
            _proposalName,
            _recipient,
            _amount,
            _description
        );

        console.log(
            string.concat("=== Creating ", proposalParams.name, " ===")
        );

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
        string memory description = proposalParams.description;

        // Display proposal details
        displayProposalDetails(targets, values, calldatas, description);

        // Create the proposal
        uint256 proposalId = createProposal(
            targets,
            values,
            calldatas,
            description
        );

        // Display results and next steps
        displayCreationResults(proposalId);
        displayNextStepsParameterized();
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

        proposalId = ensGovernor.propose(
            targets,
            values,
            calldatas,
            description
        );

        vm.stopBroadcast();

        // Assert proposal was created successfully
        assertGt(proposalId, 0, "Proposal ID should be greater than zero");

        return proposalId;
    }

    /**
     * @dev Returns the target contracts for this proposal
     */
    function getProposalTargets() internal pure returns (address[] memory) {
        address[] memory targets = new address[](1);
        targets[0] = Constants.ENS_TOKEN_ADDRESS;
        return targets;
    }

    /**
     * @dev Returns the ETH values for this proposal
     */
    function getProposalValues() internal pure returns (uint256[] memory) {
        uint256[] memory values = new uint256[](1);
        values[0] = 0; // No ETH being sent
        return values;
    }

    /**
     * @dev Returns the calldata for this proposal
     */
    function getProposalCalldatas() internal view returns (bytes[] memory) {
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ensToken.transfer.selector,
            proposalParams.recipient,
            proposalParams.amount
        );
        return calldatas;
    }

    /**
     * @dev Display information about the proposal creator
     */
    function displayProposerInfo() internal view {
        console.log("--- Proposer Information ---");
        console.log("Proposer: Alice");
        console.log("Proposer Address:", Constants.ALICE);
        console.log(
            "Voting Power:",
            ensToken.getVotes(Constants.ALICE) / 1e18,
            "votes"
        );
        console.log(
            "Proposal Threshold:",
            ensGovernor.proposalThreshold() / 1e18,
            "votes required"
        );
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
        console.log(string.concat("--- ", proposalParams.name, " Details ---"));
        console.log("Target Contract:", targets[0]);
        console.log("ETH Value:", values[0]);
        console.log("Description:", description);

        // Log additional details if function selector is a transfer
        if (calldatas.length > 0 && calldatas[0].length >= 4) {
            bytes4 selector = bytes4(calldatas[0]);
            if (selector == ensToken.transfer.selector) {
                console.log("Function: transfer(address,uint256)");
                console.log("Recipient:", proposalParams.recipient);
                console.log(
                    "Amount:",
                    proposalParams.amount / 1e18,
                    "ENS tokens"
                );
            }
        }
        console.log("");
    }

    /**
     * @dev Display creation results
     */
    function displayCreationResults(uint256 proposalId) internal view {
        console.log(
            string.concat("SUCCESS: ", proposalParams.name, " created!")
        );
        console.log("Proposal ID:", proposalId);

        // Display post-creation info
        displayProposalState(proposalId);

        // Assert proposal is in Pending state initially
        assertEq(
            uint8(ensGovernor.state(proposalId)),
            0,
            "Proposal should be in Pending state initially"
        );
    }

    /**
     * @dev Display the state of the proposal
     */
    function displayProposalState(uint256 proposalId) internal view {
        console.log(string.concat("--- ", proposalParams.name, " Status ---"));
        uint8 state = uint8(ensGovernor.state(proposalId));
        console.log("Proposal State:", getStateName(state));
        console.log(
            "Voting starts at block:",
            ensGovernor.proposalSnapshot(proposalId)
        );
        console.log(
            "Voting ends at block:",
            ensGovernor.proposalDeadline(proposalId)
        );
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

    /**
     * @dev Display next steps instructions for parameterized scripts
     */
    function displayNextStepsParameterized() internal view {
        console.log("");
        console.log("NEXT STEPS:");
        console.log(
            "1. Skip blocks to make proposal active: cast rpc anvil_mine 2 --rpc-url http://localhost:8545"
        );
        console.log(
            "2. Run voting script with parameters (last 3 params are vote choices: 0=AGAINST, 1=FOR, 2=ABSTAIN):"
        );
        console.log(
            string.concat(
                '   forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "',
                proposalParams.name,
                '" ',
                vm.toString(proposalParams.recipient),
                " ",
                vm.toString(proposalParams.amount),
                ' "',
                proposalParams.description,
                '" 1 1 1 --rpc-url http://localhost:8545 --broadcast'
            )
        );
    }
}
