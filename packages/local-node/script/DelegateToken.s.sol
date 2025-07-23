// apps/local-node/script/DelegateToken.s.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title DelegateToken
 * @dev Parameterized delegation script
 *      Allows delegation from any account to any other account
 */
contract DelegateToken is BaseScript, Test {
    ENSToken public ensToken;

    function setUp() public override {
        super.setUp();
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
    }

    /**
     * @dev Main delegation function that can be called with different parameters
     * @param delegatorPrivateKey The private key of the account delegating
     * @param delegateAddress The address to delegate voting power to
     * @param description A description for logging purposes
     */
    function run(
        uint256 delegatorPrivateKey,
        address delegateAddress,
        string memory description
    ) public {
        // Get the delegator address from the private key
        address delegatorAddress = vm.addr(delegatorPrivateKey);

        console.log("=== Token Delegation Script ===");
        console.log("Description:", description);
        console.log("Delegator:", delegatorAddress);
        console.log("Delegate:", delegateAddress);

        // Check delegator has tokens
        uint256 delegatorBalance = ensToken.balanceOf(delegatorAddress);
        console.log("Delegator balance:", delegatorBalance / 1e18, "ENS");

        // Get current delegate (if any)
        address currentDelegate = ensToken.delegates(delegatorAddress);
        console.log("Current delegate:", currentDelegate);

        // Get voting power before delegation
        uint256 delegateVotesBefore = ensToken.getVotes(delegateAddress);
        uint256 currentDelegateVotesBefore = ensToken.getVotes(currentDelegate);

        console.log(
            "Delegate votes before:",
            delegateVotesBefore / 1e18,
            "ENS"
        );
        if (currentDelegate != address(0)) {
            console.log(
                "Current delegate votes before:",
                currentDelegateVotesBefore / 1e18,
                "ENS"
            );
        }

        // Perform the delegation
        vm.startBroadcast(delegatorPrivateKey);
        ensToken.delegate(delegateAddress);
        vm.stopBroadcast();

        // Get voting power after delegation
        uint256 delegateVotesAfter = ensToken.getVotes(delegateAddress);
        uint256 currentDelegateVotesAfter = ensToken.getVotes(currentDelegate);

        console.log("Delegate votes after:", delegateVotesAfter / 1e18, "ENS");
        if (
            currentDelegate != address(0) && currentDelegate != delegateAddress
        ) {
            console.log(
                "Previous delegate votes after:",
                currentDelegateVotesAfter / 1e18,
                "ENS"
            );
        }

        // Verify the delegation worked
        address newDelegate = ensToken.delegates(delegatorAddress);
        assertEq(newDelegate, delegateAddress, "Delegation failed");

        console.log("SUCCESS: Delegation completed!");
        console.log(
            "Voting power transferred:",
            delegatorBalance / 1e18,
            "ENS"
        );
        console.log("New delegate:", newDelegate);
        console.log("");
    }

    /**
     * @dev Convenience function for self-delegation using account name
     * @param accountName The name of the account (ALICE, BOB, CHARLIE, DAVID)
     * @param description A description for logging purposes
     */
    function runSelfDelegate(
        string memory accountName,
        string memory description
    ) public {
        (uint256 privateKey, address accountAddress) = getAccountByName(
            accountName
        );
        run(privateKey, accountAddress, description);
    }

    /**
     * @dev Helper function to get account details by name
     */
    function getAccountByName(
        string memory accountName
    ) internal pure returns (uint256 privateKey, address accountAddress) {
        bytes32 nameHash = keccak256(abi.encodePacked(accountName));

        if (nameHash == keccak256(abi.encodePacked("ALICE"))) {
            return (Constants.ALICE_PRIVATE_KEY, Constants.ALICE);
        } else if (nameHash == keccak256(abi.encodePacked("BOB"))) {
            return (Constants.BOB_PRIVATE_KEY, Constants.BOB);
        } else if (nameHash == keccak256(abi.encodePacked("CHARLIE"))) {
            return (Constants.CHARLIE_PRIVATE_KEY, Constants.CHARLIE);
        } else if (nameHash == keccak256(abi.encodePacked("DAVID"))) {
            return (Constants.DAVID_PRIVATE_KEY, Constants.DAVID);
        } else {
            revert("Unknown account name");
        }
    }
}
