// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProfilePic is ERC721A, Ownable {
    /*---------------
        Storage
    ---------------*/

    string public baseUri;

    uint256 public whiteListStartTime;
    uint256 public publicStartTime;

    uint256 public supply = 100;
    uint256 public maxWhiteListMintAmount = 5;
    uint256 public maxPublicMintAmount = 3;
    uint256 public whiteListCost = 0.002 ether;
    uint256 public publicCost = 0.004 ether;

    mapping(address => bool) public whitelistClaimed;
    mapping(address => bool) public publicClaimed;
    mapping(address => uint256) public mintedTokens;

    bytes32 public merkleRoot;

    constructor(
        uint256 whiteListStartTime_,
        uint256 publicStartTime_,
        bytes32 merkleRoot_
    ) ERC721A("TestPfp", "TPFP") {
        whiteListStartTime = whiteListStartTime_;
        publicStartTime = publicStartTime_;
        merkleRoot = merkleRoot_;
    }

    // TODO Add Events
    // TODO Add set MerkleRoot function
    // TODO Optimise

    /*----------------------------
        State Changing Functions 
    -----------------------------*/
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

        if (mintedTokens[to_] >= maxWhiteListMintAmount) {
            whitelistClaimed[to_] = true;
        }

        if (mintedTokens[to_] + quantity > maxWhiteListMintAmount)
            revert("Max mint amount will be exceeded.");

        mintedTokens[to_] += quantity;

        _safeMint(to_, quantity);
    }

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

    // Does transfer need to be ownable? Dont want anyone tranferring tokens around
    function transfer(
        address from_,
        address to_,
        uint256 tokenID
    ) public {
        safeTransferFrom(from_, to_, tokenID);
    }

    /*------------------
        View Functions
    --------------------*/

    function getStartingID() public view returns (uint256) {
        return _startTokenId();
    }

    function numberMinted(address holder) public view returns (uint256) {
        return _numberMinted(holder);
    }

    function getOwnerOf(uint256 tokenID) public view returns (address) {
        return ownerOf(tokenID);
    }

    /*---------------------------
        ownly owner functions
    ----------------------------*/

    function setBaseURI(string memory _baseUri) public onlyOwner {
        baseUri = _baseUri;
    }

    /*---------------------------
        internal functions
    ----------------------------*/

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
}
