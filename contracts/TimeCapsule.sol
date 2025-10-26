// pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// contract TimeCapsule {
//     struct Capsule {
//         address owner;
//         uint256 amount;
//         string message;
//         string fileHash; // for image/NFT
//         uint256 unlockTime;
//         bool opened;
//     }

//     IERC20 public pyusdToken;
//     uint256 public capsuleCount;
//     mapping(uint256 => Capsule) public capsules;

//     event CapsuleCreated(uint256 id, address owner, uint256 amount, uint256 unlockTime);
//     event CapsuleOpened(uint256 id, address owner, uint256 amount);

//     constructor(address _pyusdToken) {
//         pyusdToken = IERC20(_pyusdToken);
//     }

//     function createCapsule(uint256 _amount, string memory _message, string memory _fileHash, uint256 _unlockTime) external {
//         require(_amount > 0, "Amount > 0");
//         require(_unlockTime > block.timestamp, "Unlock in future");

//         capsuleCount++;
//         capsules[capsuleCount] = Capsule({
//             owner: msg.sender,
//             amount: _amount,
//             message: _message,
//             fileHash: _fileHash,
//             unlockTime: _unlockTime,
//             opened: false
//         });

//         pyusdToken.transferFrom(msg.sender, address(this), _amount);

//         emit CapsuleCreated(capsuleCount, msg.sender, _amount, _unlockTime);
//     }

//     function openCapsule(uint256 _id) external {
//         Capsule storage c = capsules[_id];
//         require(c.owner == msg.sender, "Not owner");
//         require(!c.opened, "Already opened");
//         require(block.timestamp >= c.unlockTime, "Too early");

//         c.opened = true;
//         pyusdToken.transfer(c.owner, c.amount);

//         emit CapsuleOpened(_id, c.owner, c.amount);
//     }

//     function getCapsule(uint256 _id) external view returns (Capsule memory) {
//         return capsules[_id];
//     }
// }

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TimeCapsule is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Capsule {
        address owner;
        uint256 amount;
        string message;
        string fileHash; // for image/NFT
        uint256 unlockTime;
        bool opened;
    }

    IERC20 public pyusdToken;
    uint256 public capsuleCount;
    mapping(uint256 => Capsule) public capsules;
    mapping(address => uint256[]) private userCapsules;

    uint256 public constant MAX_MESSAGE_LENGTH = 500;
    uint256 public constant MAX_HASH_LENGTH = 100;

    event CapsuleCreated(
        uint256 indexed id, 
        address indexed owner, 
        uint256 amount, 
        uint256 unlockTime,
        string message,
        string fileHash
    );
    event CapsuleOpened(uint256 indexed id, address indexed owner, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    constructor(address _pyusdToken) Ownable(msg.sender) {
        require(_pyusdToken != address(0), "Invalid token address");
        pyusdToken = IERC20(_pyusdToken);
    }

    function createCapsule(
        uint256 _amount, 
        string memory _message, 
        string memory _fileHash, 
        uint256 _unlockTime
    ) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(_unlockTime > block.timestamp, "Unlock time must be in future");
        require(bytes(_message).length <= MAX_MESSAGE_LENGTH, "Message too long");
        require(bytes(_fileHash).length <= MAX_HASH_LENGTH, "Hash too long");

        capsuleCount++;
        capsules[capsuleCount] = Capsule({
            owner: msg.sender,
            amount: _amount,
            message: _message,
            fileHash: _fileHash,
            unlockTime: _unlockTime,
            opened: false
        });

        userCapsules[msg.sender].push(capsuleCount);

        pyusdToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit CapsuleCreated(capsuleCount, msg.sender, _amount, _unlockTime, _message, _fileHash);
    }

    function openCapsule(uint256 _id) external nonReentrant {
        Capsule storage c = capsules[_id];
        require(c.owner == msg.sender, "Not capsule owner");
        require(!c.opened, "Capsule already opened");
        require(block.timestamp >= c.unlockTime, "Capsule locked until unlock time");

        // Checks-Effects-Interactions: Update state before external call
        c.opened = true;

        pyusdToken.safeTransfer(c.owner, c.amount);

        emit CapsuleOpened(_id, c.owner, c.amount);
    }

    function getCapsule(uint256 _id) external view returns (Capsule memory) {
        require(_id > 0 && _id <= capsuleCount, "Invalid capsule ID");
        return capsules[_id];
    }

    function getCapsulesByOwner(address _owner) external view returns (uint256[] memory) {
        return userCapsules[_owner];
    }

    function getUserCapsuleDetails(address _owner) external view returns (Capsule[] memory) {
        uint256[] memory ids = userCapsules[_owner];
        Capsule[] memory userCapsuleDetails = new Capsule[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            userCapsuleDetails[i] = capsules[ids[i]];
        }
        
        return userCapsuleDetails;
    }

    // Emergency function to recover stuck tokens (use with caution)
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        IERC20(_token).safeTransfer(owner(), _amount);
        emit EmergencyWithdraw(_token, _amount);
    }
}

