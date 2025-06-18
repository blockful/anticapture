// apps/local-node/script/VoteProposal.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title VoteProposal
 * @dev Parameterized script to vote on governance proposals with configurable vote choices
 *      Usage: forge script script/VoteProposal.s.sol --sig "run(string,address,uint256,string,uint8,uint8,uint8)" "Proposal Name" 0x... 1000000000000000000 "Description" 1 1 1
 *      Vote choices: 0=AGAINST, 1=FOR, 2=ABSTAIN
 */
contract VoteProposal is BaseScript, Test {
    ENSGovernor internal ensGovernor;
    ENSToken internal ensToken;
    uint256 internal proposalId;

    struct ProposalParams {
        string name;
        address recipient;
        uint256 amount;
        string description;
        uint8 aliceVote;
        uint8 bobVote;
        uint8 charlieVote;
    }

    // Struct to hold voting configuration
    struct VoterConfig {
        string name;
        uint256 privateKey;
        uint8 voteChoice;
    }

    ProposalParams private proposalParams;

    /**
     * @dev Parameterized run function that accepts proposal details and vote choices
     * @param _proposalName Name of the proposal (e.g., "Proposal 1")
     * @param _recipient Address to receive the ENS tokens
     * @param _amount Amount of ENS tokens to transfer (in wei)
     * @param _description Full description of the proposal
     * @param _aliceVote Alice's vote choice (0=AGAINST, 1=FOR, 2=ABSTAIN)
     * @param _bobVote Bob's vote choice (0=AGAINST, 1=FOR, 2=ABSTAIN)
     * @param _charlieVote Charlie's vote choice (0=AGAINST, 1=FOR, 2=ABSTAIN)
     */
    function run(
        string memory _proposalName,
        address _recipient,
        uint256 _amount,
        string memory _description,
        uint8 _aliceVote,
        uint8 _bobVote,
        uint8 _charlieVote
    ) public {
        // Validate vote choices
        require(
            _aliceVote <= 2,
            "Invalid Alice vote choice (0=AGAINST, 1=FOR, 2=ABSTAIN)"
        );
        require(
            _bobVote <= 2,
            "Invalid Bob vote choice (0=AGAINST, 1=FOR, 2=ABSTAIN)"
        );
        require(
            _charlieVote <= 2,
            "Invalid Charlie vote choice (0=AGAINST, 1=FOR, 2=ABSTAIN)"
        );

        // Set parameters
        proposalParams = ProposalParams(
            _proposalName,
            _recipient,
            _amount,
            _description,
            _aliceVote,
            _bobVote,
            _charlieVote
        );

        console.log(
            string.concat("=== Voting on ", proposalParams.name, " ===")
        );
        console.log(
            string.concat(
                "Vote Pattern: Alice=",
                getVoteString(_aliceVote),
                ", Bob=",
                getVoteString(_bobVote),
                ", Charlie=",
                getVoteString(_charlieVote)
            )
        );

        // Initialize contracts and calculate proposal ID
        initializeContracts();

        // Display pre-voting information
        displayProposalInfo();
        displayVoterInfo();

        // Validate pre-conditions
        validateVotingConditions();

        // Cast all votes
        castAllVotes();

        // Display results and next steps
        displayVotingResults();
        displayNextStepsParameterized();
    }

    /**
     * @dev Initialize contracts and calculate proposal ID
     */
    function initializeContracts() internal {
        // Label addresses for better readability in logs (inherited from BaseScript)
        labelAddresses();

        // Initialize contracts
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);

        // Calculate the proposal ID
        proposalId = calculateProposalId();

        console.log("Proposal ID:", proposalId);

        // Assert proposal ID is valid
        assertGt(proposalId, 0, "Proposal ID should be greater than zero");
    }

    /**
     * @dev Calculate the proposal ID using the same method as the creation script
     */
    function calculateProposalId() internal view returns (uint256) {
        address[] memory targets = getProposalTargets();
        uint256[] memory values = getProposalValues();
        bytes[] memory calldatas = getProposalCalldatas();
        bytes32 descriptionHash = keccak256(bytes(proposalParams.description));

        return
            ensGovernor.hashProposal(
                targets,
                values,
                calldatas,
                descriptionHash
            );
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
        values[0] = 0;
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
     * @dev Returns the voting configuration for this proposal using parameterized votes
     */
    function getVoterConfigs() internal view returns (VoterConfig[] memory) {
        VoterConfig[] memory voters = new VoterConfig[](3);
        voters[0] = VoterConfig(
            "Alice",
            Constants.ALICE_PRIVATE_KEY,
            proposalParams.aliceVote
        );
        voters[1] = VoterConfig(
            "Bob",
            Constants.BOB_PRIVATE_KEY,
            proposalParams.bobVote
        );
        voters[2] = VoterConfig(
            "Charlie",
            Constants.CHARLIE_PRIVATE_KEY,
            proposalParams.charlieVote
        );
        return voters;
    }

    /**
     * @dev Validate that voting conditions are met
     */
    function validateVotingConditions() internal view {
        VoterConfig[] memory voters = getVoterConfigs();

        // Assert voters have voting power before casting votes
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(
                voters[i].privateKey
            );
            assertGt(
                ensToken.getVotes(voterAddress),
                0,
                string.concat(voters[i].name, " must have voting power")
            );
        }

        // Assert proposal is in Active state (can be voted on)
        assertEq(
            uint8(ensGovernor.state(proposalId)),
            1,
            "Proposal must be in Active state to vote"
        );
    }

    /**
     * @dev Cast votes for all configured voters
     */
    function castAllVotes() internal {
        VoterConfig[] memory voters = getVoterConfigs();

        // Store initial vote counts
        (
            uint256 initialAgainst,
            uint256 initialFor,
            uint256 initialAbstain
        ) = ensGovernor.proposalVotes(proposalId);

        // Cast votes from each account
        for (uint i = 0; i < voters.length; i++) {
            castVote(
                voters[i].name,
                voters[i].privateKey,
                voters[i].voteChoice
            );
        }

        // Validate all users have voted and vote counts increased
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(
                voters[i].privateKey
            );
            assert(ensGovernor.hasVoted(proposalId, voterAddress));
        }

        // Assert vote counts increased appropriately
        (
            uint256 finalAgainst,
            uint256 finalFor,
            uint256 finalAbstain
        ) = ensGovernor.proposalVotes(proposalId);
        assertTrue(
            finalFor >= initialFor &&
                finalAgainst >= initialAgainst &&
                finalAbstain >= initialAbstain,
            "Vote counts should have increased"
        );
    }

    /**
     * @dev Display proposal information
     */
    function displayProposalInfo() internal view {
        console.log(
            string.concat("--- ", proposalParams.name, " Information ---")
        );
        uint8 state = uint8(ensGovernor.state(proposalId));
        console.log("Proposal State:", getStateName(state));
        console.log(
            "Voting Period: Block",
            ensGovernor.proposalSnapshot(proposalId),
            "to",
            ensGovernor.proposalDeadline(proposalId)
        );
        console.log("Current Block:", block.number);
        console.log("");
    }

    /**
     * @dev Display voter information before voting
     */
    function displayVoterInfo() internal view {
        console.log("--- Voter Information ---");
        VoterConfig[] memory voters = getVoterConfigs();

        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(
                voters[i].privateKey
            );
            console.log(
                string.concat(
                    voters[i].name,
                    " - Voting Power: ",
                    vm.toString(ensToken.getVotes(voterAddress) / 1e18),
                    " votes - Will vote ",
                    getVoteString(voters[i].voteChoice)
                )
            );
        }
        console.log("");
    }

    /**
     * @dev Cast a vote on the proposal
     */
    function castVote(
        string memory voterName,
        uint256 privateKey,
        uint8 voteChoice
    ) internal {
        string memory voteString = getVoteString(voteChoice);
        console.log(
            string.concat(voterName, " casting vote ", voteString, "...")
        );

        vm.startBroadcast(privateKey);
        ensGovernor.castVote(proposalId, voteChoice);
        vm.stopBroadcast();

        console.log(
            string.concat("SUCCESS: ", voterName, " voted ", voteString)
        );
    }

    /**
     * @dev Display final voting results
     */
    function displayVotingResults() internal view {
        console.log(
            string.concat(
                "--- Final Voting Results for ",
                proposalParams.name,
                " ---"
            )
        );

        // Get vote counts
        (
            uint256 againstVotes,
            uint256 forVotes,
            uint256 abstainVotes
        ) = ensGovernor.proposalVotes(proposalId);

        console.log("FOR votes:", forVotes / 1e18);
        console.log("AGAINST votes:", againstVotes / 1e18);
        console.log("ABSTAIN votes:", abstainVotes / 1e18);
        console.log(
            "Total votes cast:",
            (forVotes + againstVotes + abstainVotes) / 1e18
        );

        // Check if voters have voted
        VoterConfig[] memory voters = getVoterConfigs();
        for (uint i = 0; i < voters.length; i++) {
            address voterAddress = getAddressFromPrivateKey(
                voters[i].privateKey
            );
            console.log(
                string.concat(voters[i].name, " has voted: "),
                ensGovernor.hasVoted(proposalId, voterAddress)
            );
        }

        console.log("");
        console.log(
            string.concat(
                "SUCCESS: All votes cast successfully on ",
                proposalParams.name,
                "!"
            )
        );
    }

    /**
     * @dev Get address from private key (mapping known private keys)
     */
    function getAddressFromPrivateKey(
        uint256 privateKey
    ) internal pure returns (address) {
        if (privateKey == Constants.ALICE_PRIVATE_KEY) return Constants.ALICE;
        if (privateKey == Constants.BOB_PRIVATE_KEY) return Constants.BOB;
        if (privateKey == Constants.CHARLIE_PRIVATE_KEY)
            return Constants.CHARLIE;
        if (privateKey == Constants.DAVID_PRIVATE_KEY) return Constants.DAVID;
        revert("Unknown private key");
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
     * @dev Convert vote choice to readable string
     */
    function getVoteString(
        uint8 voteChoice
    ) internal pure returns (string memory) {
        if (voteChoice == Constants.FOR) return "FOR";
        if (voteChoice == Constants.AGAINST) return "AGAINST";
        if (voteChoice == Constants.ABSTAIN) return "ABSTAIN";
        return "UNKNOWN";
    }

    /**
     * @dev Display next steps instructions for parameterized scripts
     */
    function displayNextStepsParameterized() internal view {
        console.log("");
        console.log("NEXT STEPS:");
        console.log(
            "1. Skip blocks to end voting period: cast rpc anvil_mine 200 --rpc-url http://localhost:8545"
        );
        console.log(
            "2. Skip blocks for timelock delay: cast rpc anvil_mine 2 --rpc-url http://localhost:8545"
        );
        console.log("3. Run queue script with parameters:");
        console.log(
            string.concat(
                '   forge script script/QueueProposal.s.sol --sig "run(string,address,uint256,string)" "',
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
