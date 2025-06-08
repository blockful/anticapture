// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {BaseScript} from "./BaseScript.sol";
import {ENSGovernor} from "../src/ens/ENSGovernor.sol";
import {ENSToken} from "../src/ens/ENSToken.sol";
import {Constants} from "./Constants.sol";

/**
 * @title CheckGovernanceParams
 * @dev Script to check ENS governance parameters and voting power
 */
contract CheckGovernanceParams is BaseScript {
    ENSGovernor ensGovernor;
    ENSToken ensToken;

    function run() public {
        console.log("=== ENS Governance Parameters ===");
        
        ensGovernor = ENSGovernor(payable(Constants.ENS_GOVERNOR_ADDRESS));
        ensToken = ENSToken(Constants.ENS_TOKEN_ADDRESS);
        
        // Get governance parameters
        uint256 votingDelay = ensGovernor.votingDelay();
        uint256 votingPeriod = ensGovernor.votingPeriod();
        uint256 proposalThreshold = ensGovernor.proposalThreshold();
        uint256 currentBlock = block.number;
        
        console.log("Current block:", currentBlock);
        console.log("Voting delay (blocks):", votingDelay);
        console.log("Voting period (blocks):", votingPeriod);
        console.log("Proposal threshold:", proposalThreshold / 1e18, "ENS");
        
        // Get total supply and quorum
        uint256 totalSupply = ensToken.totalSupply();
        uint256 quorum = ensGovernor.quorum(currentBlock - 1);
        
        console.log("Total ENS supply:", totalSupply / 1e18, "ENS");
        console.log("Required quorum:", quorum / 1e18, "ENS");
        console.log("Quorum percentage:", (quorum * 100) / totalSupply, "%");
        
        console.log("");
        console.log("=== Current Voting Power ===");
        
        // Check voting power of our test accounts
        uint256 aliceVotes = ensToken.getVotes(Constants.ALICE);
        uint256 bobVotes = ensToken.getVotes(Constants.BOB);
        uint256 charlieVotes = ensToken.getVotes(Constants.CHARLIE);
        uint256 davidVotes = ensToken.getVotes(Constants.DAVID);
        
        console.log("Alice voting power:", aliceVotes / 1e18, "ENS");
        console.log("Bob voting power:", bobVotes / 1e18, "ENS");
        console.log("Charlie voting power:", charlieVotes / 1e18, "ENS");
        console.log("David voting power:", davidVotes / 1e18, "ENS");
        
        uint256 totalOurVotes = aliceVotes + bobVotes + charlieVotes + davidVotes;
        console.log("Total our voting power:", totalOurVotes / 1e18, "ENS");
        
        console.log("");
        console.log("=== Analysis ===");
        if (totalOurVotes >= quorum) {
            console.log("SUCCESS: We have enough voting power to meet quorum!");
        } else {
            console.log("PROBLEM: We don't have enough voting power to meet quorum");
            console.log("Need quorum:", quorum / 1e18);
            console.log("Our voting power:", totalOurVotes / 1e18);
            console.log("Shortfall:", (quorum - totalOurVotes) / 1e18);
        }
        
        if (aliceVotes >= proposalThreshold) {
            console.log("SUCCESS: Alice can create proposals");
        } else {
            console.log("PROBLEM: Alice cannot create proposals");
        }
    }
} 