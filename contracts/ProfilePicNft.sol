// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ProfilePic is ERC721A {
    string public baseUri;
    string public hiddenBaseUri;
    bool public paused = true;
    bool public hidden = true;
    uint256 public supply = 100;
    uint256 public maxMintAmount = 5;
    uint256 public cost = 0.002 ether;
    address public owner;
    bytes32 public merkleRoot =
        0x185622dc03039bc70cbb9ac9a4a086aec201f986b154ec4c55dad48c0a474e23;

    mapping(address => bool) public whitelistClaimed;

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
        require(quantity <= 5, "max mint amount exceeded");
        require(!whitelistClaimed[msg.sender], "Address has already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Proof"
        );

        whitelistClaimed[msg.sender] = true;
        // _safeMint's second argument now takes in a quantity, not a tokenId.
        _safeMint(msg.sender, quantity);
    }
}
