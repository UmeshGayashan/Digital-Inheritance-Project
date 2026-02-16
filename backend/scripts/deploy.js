import hre from "hardhat";

async function main() {
    const [deployer, beneficiary] = await hre.ethers.getSigners();

    console.log("Deploying contract with account:", deployer.address);
    console.log("Beneficiary account:", beneficiary.address);

    const DigitalInheritance = await hre.ethers.getContractFactory("DigitalInheritance");
    // Pass beneficiary address to constructor
    const digitalInheritance = await DigitalInheritance.deploy(beneficiary.address);

    await digitalInheritance.waitForDeployment();
    const address = await digitalInheritance.getAddress();

    console.log(`DigitalInheritance deployed to ${address}`);

    // Output for frontend
    console.log("Contract Address:", address);
    console.log("Owner Address:", deployer.address);
    console.log("Beneficiary Address:", beneficiary.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
