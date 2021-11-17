const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("Rps", function () {
  let rpsContract;
  let usdcContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let addr1RPS;
  let addr2RPS;
  let addr1USDC;
  let addr2USDC;

  beforeEach(async function () {

    const Usdc = await hre.ethers.getContractFactory("USDC");
    usdcContract = await Usdc.deploy();

    const Rps = await hre.ethers.getContractFactory("Rps");
    rpsContract = await Rps.deploy(usdcContract.address);

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    await usdcContract.mint(addr1.address, 5000);
    await usdcContract.mint(addr2.address, 5000);
  });

  describe("deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rpsContract.owner()).to.equal(owner.address);
    });
  });

  beforeEach(async function () {
    addr1USDC = await usdcContract.connect(addr1);
    addr1RPS = await rpsContract.connect(addr1);

    addr2USDC = await usdcContract.connect(addr2);
    addr2RPS = await rpsContract.connect(addr2);
  });
  describe("Transactions", function () {
    it("Should enroll accounts", async function () {

      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);

      const player1 = await rpsContract.enrolledPlayers(addr1.address);
      expect(player1).to.equal(true);
      const player2 = await rpsContract.enrolledPlayers(addr2.address);
      expect(player2).to.equal(true);

    });

    it("Should allow to submit move", async function () {
      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr1RPS.submitMove(1,2000);
    });

    it("Should allow to submit move and fight player 2", async function () {
      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);


      addr1RPS.submitMove(1,2000);
      addr2RPS.submitMove(1,2000);

      addr2RPS.battleWith(addr1.address);
    });

    it("Should win fight with player 2 and have balance 0, since it has not been withdrawn", async function () {
      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);

      addr1RPS.submitMove(1,2000);
      addr2RPS.submitMove(0,2000);

      addr2RPS.battleWith(addr1.address);

      const bal = await addr1RPS.getPlayerBalance(owner.address);
      expect(bal).to.equal(0)
    });

    it("Should not be able to battle when not enrolled", async function () {
      await expect(
          rpsContract.connect(addr2).submitMove(0,2000)
      ).to.be.revertedWith("Player is not enrolled");
    });

    it("Should not be able to battle with self", async function () {
      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);
      addr2RPS.submitMove(1,2000);
      await expect(
          rpsContract.connect(addr2).battleWith(addr2.address)
      ).to.be.revertedWith("who plays with themselves");
    });

    it("Should be able to fight and withdraw funds/earnings", async function (){
      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);
      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      addr1RPS.submitMove(0,2000);
      addr2RPS.submitMove(2,2000);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.connect(addr1).battleWith(addr2.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(addr1.address, addr2.address, 0);

      // addr1RPS.withdrawBalance();

      // Players have 5k each and deposits 2000 to the contract, each used 2000 bet.
      // Player 1 wins 2000, now Player have 2000 usdc.
      await expect(rpsContract.connect(addr1).withdrawBalance())
          .to.emit(rpsContract, 'Withdrawal')
          .withArgs(addr1.address, 4000);

      // Total USDC of player 1 should now be 7000; 4000 + 3000
      let earnings = await usdcContract.balanceOf(addr1.address);
      expect(earnings).to.equal(7000);
    })

  })
  describe("Rock Paper Scissor simulation", function () {
    it("Player 1(Rock) Should win over Scissors", async function () {

      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);
      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      addr1RPS.submitMove(0,2000);
      addr2RPS.submitMove(2,2000);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.connect(addr1).battleWith(addr2.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(addr1.address, addr2.address, 0);
    })

    it("Player 1(Paper) Should lose over Scissors", async function () {

      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);
      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      addr1RPS.submitMove(1,2000);
      addr2RPS.submitMove(2,2000);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.connect(addr1).battleWith(addr2.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(addr1.address, addr2.address, 1);
    })

    it("Player 1(Paper) and Player 2(Paper) results should be DRAW", async function () {

      addr1USDC.approve(rpsContract.address, 2000);
      addr1RPS.enrollPlayer(2000);

      addr2USDC.approve(rpsContract.address, 2000);
      addr2RPS.enrollPlayer(2000);
      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      addr1RPS.submitMove(1,2000);
      addr2RPS.submitMove(1,2000);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.connect(addr1).battleWith(addr2.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(addr1.address, addr2.address, 2);
    })
  });
});