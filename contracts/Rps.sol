//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Rps is Ownable {
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
    }

    event Enrolled(address player);
    event MatchEnded(address player1, address player2, Result result);

    mapping(address => bool) public enrolledPlayers;
    mapping(address => uint256) public playersBal;
    mapping(address => PlayersPool) public playersPool;

    modifier isEnrolled() {
        require(enrolledPlayers[msg.sender], 'Player is not enrolled');
        _;
    }

    function enrollPlayer() external payable {
        require(msg.value >= 0.002 * 10**18, 'Pay to play');
        enrolledPlayers[msg.sender] = true;
        emit Enrolled(msg.sender);
    }

    function submitMove(uint _move, uint _bet) external isEnrolled {
        require(_bet >= 0, 'Bet amount minimum is 0');
        require(!playersPool[msg.sender].moveSubmitted, 'you have already chose a move, wait for an opponent');

        playersPool[msg.sender] = PlayersPool({
            player: msg.sender,
            moveChoice: Move(_move),
            moveSubmitted: true,
            bet: _bet
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
                    playersBal[p1.player] += p1.bet;
                    p2.bet = p2.bet - p1.bet;
                } else {
                    playersBal[p1.player] += p2.bet;
                    p2.bet = 0;
                }
                isFinished = true;
                emit MatchEnded(p1.player, p2.player, Result.PLAYER1);
                return;
            }
        }

        if (!isFinished) {
            if (p2.bet <= p1.bet) {
                playersBal[p2.player] += p2.bet;
                p1.bet = p1.bet - p2.bet;
            } else {
                playersBal[p2.player] += p1.bet;
                p1.bet = 0;
            }

            emit MatchEnded(p1.player, p2.player, Result.PLAYER2);
            return;
        }
    }

    function getPlayerBalance(address _address) public view returns (uint256) {
        return playersBal[_address];
    }
}