// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ENSToken} from "../src/ENSToken.sol";
import {ENSGovernor, TimelockController} from "../src/ENSGovernor.sol";

contract DeployENS is Script {
    function run() external {
        uint256 tokensFreeSupply = 100 ether;
        uint256 airdropSupply = 200 ether;
        uint256 claimPeriodEnds = block.timestamp + 40 days;

        address[] memory anvilAddresses = new address[](4);
        for (uint16 i = 0; i < 4; i++) {
            anvilAddresses[i] = [
                address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266),
                address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8),
                address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC),
                address(0x90F79bf6EB2c4f870365E785982E1f101E93b906)
            ][i];
        }

        address[] memory proposers = anvilAddresses;
        address[] memory executors = anvilAddresses;

        vm.startBroadcast();

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
