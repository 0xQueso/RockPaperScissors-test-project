const hre = require("hardhat");

async function main() {
    const Rps = await hre.ethers.getContractFactory("Rps");
    const rps = await Rps.deploy();
    await rps.deployed();

    txn = await rps.enrollPlayer({value: 0.002 * 10**18});
    await rps.submitMove(0,20);

    console.log("Greeter deployed to:", rps.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
