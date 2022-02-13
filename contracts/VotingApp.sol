// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

struct User {
    bool isRegistered;
    bool alreadyVoted;
}

struct Candidate {
    string name;
    address addr;
    string[] postulatedPositions;
}


contract VotingApp is Ownable{

    using SafeMath for uint256;

    address _owner;
    uint timestart;
    //Candidate[] candidates;
    mapping(address => User) users;
    mapping(address => Candidate) candidates;
    mapping(address => mapping(string => uint)) counters;

    function setCandidate(address _addr, string memory _name, string[] memory _postulatedPositions) external onlyOwner() {
        candidates[_addr].name = _name;
        candidates[_addr].addr = _addr;
        candidates[_addr].postulatedPositions = _postulatedPositions;
    }

}

