// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ProfilePic is ERC721A {
    /*---------------
        Storage
    ---------------*/

    string public baseUri;
    string public hiddenBaseUri;

    bool public hidden = true;
    bool public whiteListMintOpen = false;
    bool public publicMintOpen = false;

    uint256 public supply = 100;
    uint256 public maxWhiteListMintAmount = 5;
    uint256 public maxPublicMintAmount = 3;
    uint256 public whiteListCost = 0.002 ether;
    uint256 public publicCost = 0.004 ether;

    address public owner;

    mapping(address => bool) public whitelistClaimed;

    bytes32 public merkleRoot =
        0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea;

    constructor(string memory baseUri_, string memory hiddenBaseUri_)
        ERC721A("TestPfp", "TPFP")
    {
        baseUri = baseUri_;
        hiddenBaseUri = hiddenBaseUri_;
        owner = msg.sender;
    }

    function whitelistMint(uint256 quantity, bytes32[] calldata _merkleProof)
        public
        payable
    {
        require(whiteListMintOpen == true, "Whitelist mint not yet open.");
        require(quantity <= 5, "max mint amount exceeded");
        require(
            msg.value >= quantity * whiteListCost,
            "Please spend minimum price"
        );
        require(!whitelistClaimed[msg.sender], "Address has already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Proof"
        );

        whitelistClaimed[msg.sender] = true;

        _safeMint(msg.sender, quantity);
    }

    // function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
    //     merkleRoot = _merkleRoot;
    // }

    function _whiteListIsOpen(bool isOpen) public onlyOwner {
        whiteListMintOpen = isOpen;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorised!");
        _;
    }
}
