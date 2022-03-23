// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProfilePic is ERC721A {
    /*---------------
        Storage
    ---------------*/

    string public baseUri;
    string public hiddenBaseUri;

    bool public hidden = true;

    uint256 public whiteListStartTime;
    uint256 public publicStartTime;

    uint256 public supply = 100;
    uint256 public maxWhiteListMintAmount = 5;
    uint256 public maxPublicMintAmount = 3;
    uint256 public whiteListCost = 0.002 ether;
    uint256 public publicCost = 0.004 ether;

    address public owner;

    mapping(address => bool) public whitelistClaimed;
    mapping(address => bool) public publicClaimed;
    mapping(address => uint256) public mintedTokens;

    bytes32 public merkleRoot;

    constructor(
        string memory baseUri_,
        string memory hiddenBaseUri_,
        uint256 whiteListStartTime_,
        uint256 publicStartTime_,
        bytes32 merkleRoot_
    ) ERC721A("TestPfp", "TPFP") {
        baseUri = baseUri_;
        hiddenBaseUri = hiddenBaseUri_;
        whiteListStartTime = whiteListStartTime_;
        publicStartTime = publicStartTime_;
        merkleRoot = merkleRoot_;
        owner = msg.sender;
    }

    function whitelistMint(
        address to_,
        uint256 quantity,
        bytes32[] calldata _merkleProof
    ) public payable {
        require(
            whiteListStartTime >= block.timestamp,
            "whitelist mint has not started"
        );
        require(quantity <= maxWhiteListMintAmount, "max mint amount exceeded");
        require(
            msg.value >= quantity * whiteListCost,
            "Please spend minimum price"
        );
        require(!whitelistClaimed[to_], "Address has already claimed max");

        bytes32 leaf = keccak256(abi.encodePacked(to_));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Proof"
        );

        mintedTokens[to_] = quantity;

        if (mintedTokens[to_] >= 5) {
            whitelistClaimed[to_] = true;
        }

        _safeMint(to_, quantity);
    }

    // TODO write transfer function, public mint...

    function mint(address to_, uint256 quantity) public payable {
        require(
            publicStartTime >= block.timestamp,
            "public mint has not started"
        );
        require(quantity <= maxPublicMintAmount, "max mint amount exceeded");
        require(
            msg.value >= quantity * publicCost,
            "Please spend minimum price"
        );
        require(!publicClaimed[to_], "Address has already claimed max");

        mintedTokens[to_] = quantity;

        if (mintedTokens[to_] >= 3) {
            publicClaimed[to_] = true;
        }

        _safeMint(to_, quantity);
    }
}
