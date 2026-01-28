// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DigitalInheritance {
    address public owner;
    address public beneficiary;
    uint256 public lastHeartbeat;
    uint256 public timeLimit;

    event Ping(uint256 timestamp);
    event Claim(address indexed beneficiary, uint256 amount);
    event Deposit(address indexed sender, uint256 amount);

    constructor(address _beneficiary) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        owner = msg.sender;
        beneficiary = _beneficiary;
        lastHeartbeat = block.timestamp;
        timeLimit = 365 days;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Only beneficiary can call this");
        _;
    }

    function ping() external onlyOwner {
        lastHeartbeat = block.timestamp;
        emit Ping(lastHeartbeat);
    }

    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function claim() external onlyBeneficiary {
        require(block.timestamp > lastHeartbeat + timeLimit, "Owner is still active");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to claim");
        
        payable(beneficiary).transfer(balance);
        emit Claim(beneficiary, balance);
    }
}
