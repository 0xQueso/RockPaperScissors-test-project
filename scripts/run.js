const hre = require("hardhat");

async function main() {
    const Rps = await hre.ethers.getContractFactory("Rps");
    const rps = await Rps.deploy();

    const [owner, addr1, addr2] = await ethers.getSigners();
    await rps.deployed();

    // await rps.connect(accounts[2].address);
    txn = await rps.enrollPlayer({value: 0.002 * 10**18});
    await rps.submitMove(0,20);

    await rps.connect(addr1).enrollPlayer({value: 0.002 * 10**18});
    await rps.connect(addr1).submitMove(2, 30);

    await rps.battleWith(addr1.address);


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
