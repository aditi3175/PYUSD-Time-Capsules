// pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// contract MockPYUSD is ERC20 {
//     constructor() ERC20("Mock PYUSD", "mPYUSD") {
//         _mint(msg.sender, 1000000 * 10**18); // 1 million tokens to deployer
//     }

//     function mint(address to, uint256 amount) external {
//         _mint(to, amount);
//     }
// }


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPYUSD is ERC20, Ownable {
    constructor() ERC20("Mock PYUSD", "mPYUSD") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // 1 million tokens to deployer
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
