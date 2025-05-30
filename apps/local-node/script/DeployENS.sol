// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";
import {Constants} from "./Constants.sol";

contract DeployENS is Script {
    uint256 public constant VOTING_DELAY = 1;
    uint256 public constant VOTING_PERIOD = 50400;
    uint256 public constant PROPOSAL_THRESHOLD = 1;

    /**
     * @dev Label addresses for better readability in logs
     */
    function labelAddresses() internal {
        // Label user addresses
        vm.label(Constants.ALICE, "Alice");
        vm.label(Constants.BOB, "Bob");
        vm.label(Constants.CHARLIE, "Charlie");
        vm.label(Constants.DAVID, "David");
        
        // Label contract addresses (will be set after deployment)
        vm.label(Constants.ENS_TOKEN_ADDRESS, "ENSToken");
        vm.label(Constants.ENS_GOVERNOR_ADDRESS, "ENSGovernor");
        vm.label(Constants.ENS_TIMELOCK_ADDRESS, "ENSTimelock");
    }

    function run() external {
        // Label addresses for better readability in logs
        labelAddresses();
        
        uint256 tokensFreeSupply = 100 ether;
        uint256 airdropSupply = 200 ether;
        uint256 claimPeriodEnds = block.timestamp + 40 days;

        address[] memory anvilAddresses = new address[](4);
        anvilAddresses[0] = Constants.ALICE;
        anvilAddresses[1] = Constants.BOB; 
        anvilAddresses[2] = Constants.CHARLIE;
        anvilAddresses[3] = Constants.DAVID;

        address[] memory proposers = anvilAddresses;
        address[] memory executors = anvilAddresses;

        vm.startBroadcast(Constants.ALICE_PRIVATE_KEY);

        ENSToken ensToken = new ENSToken(tokensFreeSupply, airdropSupply, claimPeriodEnds);

        TimelockController timelockController = new TimelockController(1, proposers, executors, proposers[0]);
        ENSGovernor ensGovernor = new ENSGovernor(ensToken, timelockController);
        timelockController.grantRole(timelockController.PROPOSER_ROLE(), address(ensGovernor));
        timelockController.grantRole(timelockController.EXECUTOR_ROLE(), address(ensGovernor));
        timelockController.grantRole(timelockController.CANCELLER_ROLE(), address(ensGovernor));
        timelockController.grantRole(timelockController.TIMELOCK_ADMIN_ROLE(), address(ensGovernor));

        vm.stopBroadcast();

        console.log("ENS Token", address(ensToken));
        console.log("ENS Governor", address(ensGovernor));
        console.log("ENS Timelock", address(timelockController));
    }
}
