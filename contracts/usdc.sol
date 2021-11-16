// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    uint256 _totalSupply;
    address private owner;
    uint private INITIAL_SUPPLY = 100000000000000000000 * (10 ** decimals());

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perfom this action");
        _;
    }

    constructor() ERC20("USD Coin", "USDC") {
        owner = msg.sender;
        _totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function totalSupply() public view override returns (uint256){
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256){
        return balances[account];
    }

    function mint(address account, uint256 tokens) public onlyOwner {
        require(account != address(0), "USDC: mint to the zero address");
        require(tokens > 0, "USDC: mint 0 amount");
        // Increase total supply
        _totalSupply += tokens;
        // Add amount to the account balance using the balance mapping
        balances[account] += tokens;
        // Emit our event to log the action
        emit Transfer(address(0), account, tokens);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        require(account != address(0), "USDC: burn from the zero address");
        uint256 accountBalance = balances[account];
        require(accountBalance >= amount, "USDC: burn amount exceeds balance");
    unchecked {
        balances[account] = accountBalance - amount;
    }
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }

    function transfer(address to, uint256 tokens) public override returns (bool){
        require(to != address(0), "USDC: transfer from the zero address");
        require(msg.sender != address(0), "ERC20: transfer to the zero address");
        require(tokens <= balances[msg.sender], "USDC: tokens should be less/equal to the balance of the sender");
        balances[msg.sender] = balances[msg.sender] - tokens;
        balances[to] = balances[to]  + tokens;
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    function transferFrom(address from, address to, uint tokens) public override returns (bool){
        require(allowed[from][msg.sender] >= tokens,"The allowance should be more or equal to the tokens to be transfered");
        balances[from] = balances[from] - tokens;
        allowed[from][msg.sender] = allowed[from][msg.sender] - tokens;
        balances[to] = balances[to] + tokens;
        emit Transfer(from,to,tokens);
        return true;
    }
    function approve(address to, uint256 amount) public virtual override returns (bool) {
        _approve(msg.sender, to, amount);
        return true;
    }
    function _approve(address from, address to, uint tokens) internal override{
        require(to != address(0), "USDC: approve from the zero address");
        require(from != address(0), "USDC: approve to the zero address");
        require(balances[from] >= tokens, "USDC: the amount of tokens to be allowed should more than the total balance");
        allowed[from][to] = tokens;
        emit Approval(from,to,tokens);
    }

    function mortalKill() public onlyOwner {
        selfdestruct(payable(owner));
    }

}