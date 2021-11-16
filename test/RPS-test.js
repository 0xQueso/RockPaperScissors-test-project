const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rps", function () {

  let Token;
  let rpsContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    Token = await ethers.getContractFactory("Rps");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    rpsContract = await Token.deploy();
  });

  describe("deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rpsContract.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", function () {
    it("Should enroll accounts", async function () {
      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      const player1 = await rpsContract.enrolledPlayers(owner.address);
      expect(player1).to.equal(true);
      const player2 = await rpsContract.enrolledPlayers(addr1.address);
      expect(player2).to.equal(true);
    });

    it("Should allow to submit move", async function () {
      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      await rpsContract.submitMove(1,10);
      await rpsContract.connect(addr1).submitMove(0,10);
    });

    it("Should allow to submit move and fight player 2", async function () {
      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      await rpsContract.submitMove(1,10);
      await rpsContract.connect(addr1).submitMove(0,10);

      await rpsContract.battleWith(addr1.address);
    });

    it("Should win fight with player 2 and have balance earning of 10 (from opponents bet)", async function () {
      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      await rpsContract.submitMove(1,10);
      await rpsContract.connect(addr1).submitMove(0,10);

      await rpsContract.battleWith(addr1.address);

      const bal = await rpsContract.getPlayerBalance(owner.address);
      expect(bal).to.equal(10)
    });

    it("Should not be able to battle when not enrolled", async function () {
      await expect(
          rpsContract.connect(addr2).submitMove(0,10)
      ).to.be.revertedWith("Player is not enrolled");
    });

    it("Should not be able to battle with self", async function () {
      await rpsContract.connect(addr2).enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr2).submitMove(0,10);

      await expect(
          rpsContract.connect(addr2).battleWith(addr2.address)
      ).to.be.revertedWith("who plays with themselves");
    });

  })
  describe("Rock Paper Scissor simulation", function () {
    it("Player 1(Rock) Should win over Scissors", async function () {

      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      await rpsContract.submitMove(0, 10);
      await rpsContract.connect(addr1).submitMove(2, 10);

      await rpsContract.battleWith(addr1.address);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.battleWith(addr1.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(owner.address, addr1.address, 0);

      const bal = await rpsContract.getPlayerBalance(owner.address);
      expect(bal).to.equal(10);
    })

    it("Player 1(Paper) Should lose over Scissors", async function () {

      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      await rpsContract.submitMove(1, 10);
      await rpsContract.connect(addr1).submitMove(2, 10);

      await rpsContract.battleWith(addr1.address);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.battleWith(addr1.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(owner.address, addr1.address, 1);

      // balance should be 0
      const bal = await rpsContract.getPlayerBalance(owner.address);
      expect(bal).to.equal(0);
    })

    it("Player 1(Paper) and Player 2(Paper) results should be DRAW", async function () {

      await rpsContract.enrollPlayer({value: 0.002 * 10**18});
      await rpsContract.connect(addr1).enrollPlayer({value: 0.002 * 10**18});

      // Move enum [Rock = 0, Paper = 1, Scissor = 2]
      await rpsContract.submitMove(1, 10);
      await rpsContract.connect(addr1).submitMove(1, 10);

      await rpsContract.battleWith(addr1.address);

      // Result enum [Player1 = 0, Player2 = 1, Draw = 2]
      // third param is winner/result
      await expect(rpsContract.battleWith(addr1.address))
          .to.emit(rpsContract, 'MatchEnded')
          .withArgs(owner.address, addr1.address, 2);
    })
  });
});