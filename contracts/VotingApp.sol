// SPDX-License-Identifier: MIT
pragma solidity >=0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VotingApp is OwnableUpgradeable{

    // ####################### Declaring Events ####################### //

    event RegisteredSuccessfully(
        address userAddress,
        uint date
    );

    event NewCandidate(
        string name,
        address candidateAddress,
        string[] positions,
        uint date
    );

    event NewVote(
        address from,
        address to,
        string forPosition,
        uint date
    );

    event VotingStarted(
        uint startTime,
        uint endTime,
        uint candidates
    );

    // ####################### Declaring Structs ####################### //

    struct User {
        bool isRegistered;
        bool alreadyVoted;
        string[] votedPositions;
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

    // ####################### Declaring Modifiers ####################### //

    modifier isVotingPeriod {
        require(block.timestamp >= timestart && block.timestamp <= timestart.add(604800), "We are not in voting period.");
        _;
    }

    modifier isNotVotingPeriod {
        // If the timestart is 0 it means that the voting has not started 
        require(timestart == 0 || block.timestamp > timestart.add(604800), "We are in voting period.");
        _;
    }

    using SafeMath for uint256;

    address _owner;
    uint private timestart;
    uint private currentCandidates;
    mapping(address => User) private users;
    Candidate[] private candidates;
    string[] private isPosition;
    mapping(string => mapping(address => uint)) counters;

    function initialize() initializer public {
        OwnableUpgradeable.__Ownable_init();
    }

    function setPositions(string[] memory _positions) external onlyOwner() isNotVotingPeriod() {
        // The owner should set the positions before start voting and set the candidates.

        for(uint i = 0; i < _positions.length; i++){
            isPosition.push(_positions[i]);
        }
    }

    function setCandidate(Candidate[] memory _candidates) external onlyOwner() isNotVotingPeriod() {
        // The currentCandidates variable has the number of candidates currently so, this number plus
        // the number of candidates that the owner is adding cannot be more than 5. This function add
        // the candidates individually, and the postingCandidate do the rest of validations

        require(_candidates.length.add(currentCandidates) <= 5, "There cannot be more than 5 candidates in total.");
        for(uint i = 0; i < _candidates.length; i++){
            postingCandidate(_candidates[i]);
        }
    }

    function postingCandidate(Candidate memory _candidate) internal onlyOwner() isNotVotingPeriod() {
        // All positions applied for must be valid. The candidate cannot be currently registered.
        // this functions push the new candidate to the array of candidates, update the currentCandidate
        // variable, and emit the event NewCandidate.

        Candidate memory auxCandidate;
        for(uint i = 0; i < _candidate.postulatedPositions.length; i++){
            require(contains(isPosition, _candidate.postulatedPositions[i]), "The voting is not for all these positions.");
        }
        for(uint i = 0; i < candidates.length; i++){
            require(_candidate.addr != candidates[i].addr, "The candidate is already registered.");
        }
        auxCandidate.name = _candidate.name;
        auxCandidate.addr = _candidate.addr;
        auxCandidate.postulatedPositions = _candidate.postulatedPositions;
        candidates.push(auxCandidate);
        currentCandidates = candidates.length;
        emit NewCandidate(auxCandidate.name, auxCandidate.addr, auxCandidate.postulatedPositions, block.timestamp);
    }

    function Register() external isNotVotingPeriod() {
        // The user cannot be currently registered and emit the event RegisteredSuccessfully

        require(!users[msg.sender].isRegistered, "You are already registered.");
        users[msg.sender].isRegistered = true;
        users[msg.sender].alreadyVoted = false;
        emit RegisteredSuccessfully(msg.sender, block.timestamp);
    }

    function Voting(Vote[] memory _vote) external isVotingPeriod() {
        // This function does the validations to know if the user can vote, once the user vote
        // they cannot vote again in this voting and they need to re-register if they want to
        // participate in a next voting. The RegisteringVote register the vote. 

        require(!users[msg.sender].alreadyVoted, "You already vote.");
        require(users[msg.sender].isRegistered, "You are not registered.");
        for(uint i = 0; i < _vote.length; i++){
            RegisteringVote(_vote[i]);
        }
        users[msg.sender].alreadyVoted = true;
        users[msg.sender].isRegistered = false;
        for(uint i = 0; i < users[msg.sender].votedPositions.length; i++){
            users[msg.sender].votedPositions.pop();
        }
    }

    function RegisteringVote(Vote memory _vote) internal isVotingPeriod() {
        // This function does the validations to know if the vote is valid, this function receives
        // an array that each position has the address of the candidate and the position that the
        // user want to vote for. If try to vote for the same position multiple times will fail.
        // This function emit the event NewVote

        uint index = findCandidate(_vote.addr);
        require(index != 6, "This address does not belong to any candidate.");
        require(contains(candidates[index].postulatedPositions, _vote.position), "This candidate is not running for this position.");
        require(_vote.addr != msg.sender, "You can't vote for yourself.");
        require(!contains(users[msg.sender].votedPositions, _vote.position), "You already vote for this position.");
        counters[_vote.position][_vote.addr] = counters[_vote.position][_vote.addr].add(1);
        users[msg.sender].votedPositions.push(_vote.position);
        emit NewVote(msg.sender, _vote.addr, _vote.position, block.timestamp);
        
    }

    function startVoting() external onlyOwner() isNotVotingPeriod() {
        // This function sets the start time of the vote and time it ends (1 week after starting).
        // This function is necessary for the functions that have the IsVotingPeriod modifier.

        require(currentCandidates != 0, "You cannot start voting without candidates");
        timestart = block.timestamp;
        emit VotingStarted(timestart, timestart.add(604800), currentCandidates);
    }

    function resetVoting() external onlyOwner() isNotVotingPeriod() {
        // This function reset all variables for a new Voting

        require(timestart != 0, "Only can reset voting after a voting.");
        for(uint i = 0; i < isPosition.length; i++){
            for(uint j = 0; j < candidates.length; j++){
                counters[isPosition[i]][candidates[j].addr] = 0;
            }
        }
        while(candidates.length > 0){
            candidates.pop();
        }
        while(isPosition.length > 0){
            isPosition.pop();
        }
        timestart = 0;
        currentCandidates = 0;
    }

    function contains(string[] memory arr, string memory str) internal pure returns(bool){
        // This function help for some validations, receive a array of strings and a string,
        // and return true if the string is contained in the array and return false if not

        for(uint i = 0; i < arr.length; i++){
            if(keccak256(abi.encodePacked(arr[i])) == keccak256(abi.encodePacked(str))){
                return true;
            }
        }
        return false;
    }

    // ####################### Declaring Getters ####################### //

    function getUser(address addr) external view returns(User memory){
        return users[addr];
    }

    function getCounter(string memory position, address addr) external view returns(uint){
        return counters[position][addr];
    }

    function getTimestart() external view returns(uint){
        return timestart;
    }

    function getCandidates() external view returns(Candidate[] memory){
        return candidates;
    }

    function getIsPosition() external view returns(string[] memory){
        return isPosition;
    }

    function findCandidate(address addr) internal view returns(uint){
        // This help for some validations, receive an address and return the
        // index in the candidates array of that address and return 6 if the
        // address is not in the candidates array

        uint pos = 6;
        for(uint i = 0; i < candidates.length; i++){
            if(candidates[i].addr == addr){
                pos = i;
                return pos;
            }
        }
        return pos;
    }
}

