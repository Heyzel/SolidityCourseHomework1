// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract VotingApp is Ownable{

    event RegisteredSuccessfully(
        address userAddress,
        uint date
    );

    event PostCandidate(
        string name,
        address candidateAddress,
        string[] positions,
        uint date
    );

    event newVote(
        address from,
        address to,
        string forPosition,
        uint date
    );

    event startingVoting(
        uint startTime,
        uint endTime,
        uint candidates
    );

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

    modifier isVotingPeriod {
        require(block.timestamp >= timestart && block.timestamp <= timestart.add(604800), "We're not in voting period.");
        _;
    }

    modifier isNotVotingPeriod {
        require(timestart == 0 || block.timestamp > timestart.add(604800), "We're in voting period");
        _;
    }

    using SafeMath for uint256;

    address _owner;
    uint timestart;
    uint currentCandidates;
    mapping(address => User) users;
    mapping(address => Candidate) candidates;
    mapping(string => bool) isPosition;
    mapping(string => mapping(address => uint)) counters;

    function setPositions(string[] memory _positions) external onlyOwner() isNotVotingPeriod() {
        for(uint i = 0; i < _positions.length; i++){
            isPosition[_positions[i]] = true;
        }
    }

    function setCandidate(Candidate[] memory _candidates) external onlyOwner() isNotVotingPeriod() {
        require(_candidates.length.add(currentCandidates) <= 5, "There cannot be more than 5 candidates in total");
        for(uint i = 0; i < _candidates.length; i++){
            postingCandidate(_candidates[i]);
        }
    }

    function postingCandidate(Candidate memory _candidate) internal onlyOwner() isNotVotingPeriod() {
        Candidate storage auxCandidate;
        for(uint i = 0; i < _candidate.postulatedPositions.length; i++){
            require(isPosition[_candidate.postulatedPositions[i]]);
        }
        auxCandidate = candidates[_candidate.addr];
        auxCandidate.name = _candidate.name;
        auxCandidate.addr = _candidate.addr;
        auxCandidate.postulatedPositions = _candidate.postulatedPositions;
        currentCandidates = currentCandidates.add(1);
        emit PostCandidate(auxCandidate.name, auxCandidate.addr, auxCandidate.postulatedPositions, block.timestamp);
    }

    function Register() external {
        require(!users[msg.sender].isRegistered, "You're already registered.");
        users[msg.sender].isRegistered = true;
        emit RegisteredSuccessfully(msg.sender, block.timestamp);
    }

    function Voting(Vote[] memory _vote) external isVotingPeriod() {
        require(users[msg.sender].isRegistered, "You are not registered.");
        require(!users[msg.sender].alreadyVoted, "You already vote.");
        for(uint i = 0; i < _vote.length; i++){
            RegisteringVote(_vote[i]);
        }
        users[msg.sender].alreadyVoted = true;
    }

    function RegisteringVote(Vote memory _vote) internal isVotingPeriod() {
        require(candidates[_vote.addr].addr != address(0), "This address does not belong to any candidate.");
        require(contains(candidates[_vote.addr].postulatedPositions, _vote.position), "This candidate is not running for this position.");
        require(_vote.addr != msg.sender, "You can't vote for yourself.");
        require(!users[msg.sender].votedPositions[_vote.position], "You already vote for this position.");
        counters[_vote.position][_vote.addr] = counters[_vote.position][_vote.addr].add(1);
        users[msg.sender].votedPositions[_vote.position] = true;
        emit newVote(msg.sender, _vote.addr, _vote.position, block.timestamp);
        
    }

    function startVoting() external onlyOwner() isNotVotingPeriod() {
        timestart = block.timestamp;
        emit startingVoting(timestart, timestart.add(604800), currentCandidates);
    }

    function endVoting() external onlyOwner() isVotingPeriod() {
        timestart = 0;
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

