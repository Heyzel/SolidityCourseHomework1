// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

struct User {
    bool isRegistered;
    bool alreadyVoted;
    mapping(string => bool) votedPositions;
}

struct Candidate {
    string name;
    address addr;
    string[] postulatedPositions;
}

struct Vote {
    string position;
    address addr;
}

contract VotingApp is Ownable{

    using SafeMath for uint256;

    address _owner;
    uint timestart;
    bool isVotingPeriod;
    //Candidate[] candidates;
    mapping(address => User) users;
    mapping(address => Candidate) candidates;
    mapping(string => bool) isPosition;
    mapping(string => mapping(address => uint)) counters;

    function setPositions(string[] memory _positions) external onlyOwner {
        for(uint i = 0; i < _positions.length; i++){
            isPosition[_positions[i]] = true;
        }
    }

    function setCandidate(address _addr, string memory _name, string[] memory _postulatedPositions) external onlyOwner() {
        candidates[_addr].name = _name;
        candidates[_addr].addr = _addr;
        candidates[_addr].postulatedPositions = _postulatedPositions;
    }

    function signUp() external {
        require(!users[msg.sender].isRegistered, "You're already registered.");
        users[msg.sender].isRegistered = true;
    }

    function Voting(Vote[] memory _vote) external {
        require(!users[msg.sender].isRegistered, "You are not registered.");
        require(isVotingPeriod, "It's not a voting period");
        User storage user = users[msg.sender];
        for(uint i = 0; i < _vote.length; i++){
            if(candidates[_vote[i].addr].addr != address(0) && contains(candidates[_vote[i].addr].postulatedPositions, _vote[i].position)) {
                // This if means that the address within the vote belongs to a candidate
                // and the candidate is running for the position they are voting for
                counters[_vote[i].position][_vote[i].addr] = counters[_vote[i].position][_vote[i].addr].add(1);
                user.votedPositions[_vote[i].position] = true;
            }
        }
        user.alreadyVoted = true;
    }

    function contains(string[] memory arr, string memory str) internal pure returns(bool){
        for(uint i = 0; i < arr.length; i++){
            if(keccak256(abi.encodePacked(arr[i])) == keccak256(abi.encodePacked(str))){
                return true;
            }
        }
        return false;
    }

}

