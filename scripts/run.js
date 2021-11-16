const hre = require("hardhat");

async function main() {

    const Usdc = await hre.ethers.getContractFactory("USDC");
    const usdc = await Usdc.deploy();

    const Rps = await hre.ethers.getContractFactory("Rps");
    const rps = await Rps.deploy(usdc.address);

    const [owner, addr1, addr2] = await ethers.getSigners();

    await usdc.mint(addr1.address, 5000)
    await usdc.connect(addr1).approve(rps.address, 2000)
    await rps.connect(addr1).enrollPlayer(2000);

    let balance_after = await usdc.balanceOf(addr1.address);
    console.log(balance_after.toNumber());
    await rps.connect(addr1).submitMove(0,2000);


    await usdc.mint(addr2.address, 5000)
    await usdc.connect(addr2).approve(rps.address, 2000)

    await rps.connect(addr2).enrollPlayer(2000);
    let balance_after1 = await usdc.balanceOf(addr2.address);
    console.log(balance_after1.toNumber());
    await rps.connect(addr2).submitMove(1,2000);

    await rps.connect(addr2).battleWith(addr1.address);


   await rps.connect(addr2).withdrawBalance();
    let balance_after2 = await usdc.balanceOf(addr2.address);
    console.log(balance_after2.toNumber(), '3000 + ');

    await rps.deployed();

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
