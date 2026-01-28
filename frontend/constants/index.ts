export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const DOMAIN_ID = 31337; // Hardhat Localhost

export const ABI = [
    "constructor(address _beneficiary)",
    "event Claim(address indexed beneficiary, uint256 amount)",
    "event Deposit(address indexed sender, uint256 amount)",
    "event Ping(uint256 timestamp)",
    "function beneficiary() view returns (address)",
    "function claim()",
    "function deposit() payable",
    "function lastHeartbeat() view returns (uint256)",
    "function owner() view returns (address)",
    "function ping()",
    "function timeLimit() view returns (uint256)"
];
