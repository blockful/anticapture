// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";
import {Constants} from "./Constants.sol";

contract DeployENS is BaseScript {
    uint256 public constant VOTING_DELAY = 1;
    uint256 public constant VOTING_PERIOD = 50400;
    uint256 public constant PROPOSAL_THRESHOLD = 1;

    function run() external {
        // Label addresses for better readability in logs (inherited from BaseScript)
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
