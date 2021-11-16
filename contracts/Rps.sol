//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Rps is Ownable {
    ERC20 private _usdc;

    enum Move {
        ROCK,
        PAPER,
        SCISSORS
    }

    enum Result {
        PLAYER1,
        PLAYER2,
        DRAW
    }

    struct PlayersPool {
        address player;
        Move moveChoice;
        bool moveSubmitted;
        uint256 bet;
        uint256 earnings;
    }

    event Enrolled(address player);
    event MatchEnded(address player1, address player2, Result result);
    event Withdrawal(address player, uint256 amount);

    mapping(address => bool) public enrolledPlayers;
    mapping(address => uint256) public playersBal;
    mapping(address => PlayersPool) public playersPool;

    modifier isEnrolled() {
        require(enrolledPlayers[msg.sender], 'Player is not enrolled');
        _;
    }

    constructor(ERC20 token) Ownable(){
        _usdc = token;
    }

    function enrollPlayer(uint256 _balance) external payable {
        require(_balance > 0, "Enrollment balance should not be 0");
        require(_balance <= _usdc.balanceOf(msg.sender), 'Not enough USDC');
        playersBal[msg.sender] = _balance;

        _usdc.transferFrom(msg.sender, address(this), _balance);
        enrolledPlayers[msg.sender] = true;
        emit Enrolled(msg.sender);
    }

    function submitMove(uint256 _move, uint256 _bet) external isEnrolled {
        require(_bet <= playersBal[msg.sender], 'Bet is more than your current balance');
        require(!playersPool[msg.sender].moveSubmitted, 'you have already chose a move, wait for an opponent');

        playersBal[msg.sender] -= _bet;
        playersPool[msg.sender] = PlayersPool({
            player: msg.sender,
            moveChoice: Move(_move),
            moveSubmitted: true,
            bet: _bet,
            earnings:0
        });
    }

    function battleWith(address _opponentAddress) external isEnrolled {
        require(msg.sender != _opponentAddress, 'who plays with themselves');
        require(enrolledPlayers[_opponentAddress], 'opponent not enrolled');
        chooseWinner(msg.sender, _opponentAddress);
    }

    function chooseWinner(address _player1, address _player2) private {
        PlayersPool storage p1 = playersPool[_player1];
        PlayersPool storage p2 = playersPool[_player2];
        bool isFinished = p1.moveChoice == p2.moveChoice;
        p1.moveSubmitted = false;
        p2.moveSubmitted = false;

        if (isFinished) {
            emit MatchEnded(p1.player, p2.player, Result.DRAW);
            return;
        }

        string[3] memory winningCombination;
        winningCombination[0] = string (abi.encodePacked(Move.ROCK,Move.SCISSORS));
        winningCombination[1] = string (abi.encodePacked(Move.SCISSORS,Move.PAPER));
        winningCombination[2] = string (abi.encodePacked(Move.PAPER,Move.ROCK));

        string memory _player1Combination = string (abi.encodePacked(p1.moveChoice, p2.moveChoice));

        for (uint i = 0; i <= 2; i += 1) {
            if (keccak256(abi.encodePacked(winningCombination[i])) == keccak256(abi.encodePacked(_player1Combination)) && !isFinished) {
                if (p1.bet <= p2.bet) {
                    p1.earnings += p1.bet;
                    p2.bet = p2.bet - p1.bet;
                } else {
                    p1.earnings += p2.bet;
                    p2.bet = 0;
                }
                isFinished = true;
                emit MatchEnded(p1.player, p2.player, Result.PLAYER1);
                return;
            }
        }

        if (!isFinished) {
            if (p2.bet <= p1.bet) {
                p2.earnings += p2.bet;
                p1.bet = p1.bet - p2.bet;
            } else {
                p2.earnings += p1.bet;
                p1.bet = 0;
            }

            emit MatchEnded(p1.player, p2.player, Result.PLAYER2);
            return;
        }
    }

    function getPlayerBalance(address _address) public view returns (uint256) {
        return playersBal[_address];
    }

    function withdrawBalance() public isEnrolled {
        PlayersPool storage player = playersPool[msg.sender];
        uint256 withdrawable = playersBal[msg.sender] + player.bet + player.earnings;
        player.bet = 0;
        playersBal[msg.sender] = 0;

        if (_usdc.transfer(msg.sender, withdrawable)){
            emit Withdrawal(msg.sender, withdrawable);
        } else {
            revert("Unable to transfer USDC");
        }
    }
}