pragma solidity 0.6.12;

// You need this import to let your contract use the right dependency
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {

    constructor(string memory name,uint256 totalSupply) ERC20(name, name) public {

        //mint if you want to have some tokens
        // 18 here means 18 decimals, which is default
        _mint(msg.sender, totalSupply);
    }
      function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}