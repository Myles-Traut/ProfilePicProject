// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProfilePic is ERC721A, Ownable {
    using Strings for uint256;

    /*---------------
        Storage
    ---------------*/

    string public baseUri;

    uint256 public whiteListStartTime;
    uint256 public publicStartTime;

    uint256 public constant SUPPLY = 100;
    uint256 public constant MAX_WHITELIST_MINT_PER_PERSON = 5;
    uint256 public constant MAX_PUBLIC_MINT_PER_PERSON = 3;
    uint256 public constant WHITELIST_COST = 0.002 ether;
    uint256 public constant PUBLIC_COST = 0.004 ether;

    mapping(address => bool) public whitelistClaimed;
    mapping(address => bool) public publicClaimed;
    mapping(address => uint256) public mintedTokens;

    bytes32 public merkleRoot;

    constructor(uint256 whiteListStartTime_, uint256 publicStartTime_)
        ERC721A("TestPfp", "TPFP")
    {
        whiteListStartTime = whiteListStartTime_;
        publicStartTime = publicStartTime_;
    }

    // TODO Add Events
    // TODO Optimise (Custom Errors)
    // TODO add tokenuri

    /*----------------------------
        State Changing Functions 
    -----------------------------*/

    // whitelistMint and mint can only mint to the signers address.
    // Minter must then use transfer() if they wish to transfer to another address.
    function whitelistMint(uint256 quantity, bytes32[] calldata _merkleProof)
        public
        payable
    {
        require(
            whiteListStartTime >= block.timestamp,
            "whitelist mint has not started"
        );
        require(
            quantity <= MAX_WHITELIST_MINT_PER_PERSON,
            "max mint amount exceeded"
        );
        require(
            msg.value >= quantity * WHITELIST_COST,
            "Please spend minimum price"
        );
        require(
            !whitelistClaimed[msg.sender],
            "Address has already claimed max"
        );

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Proof"
        );

        if (mintedTokens[msg.sender] + quantity > MAX_WHITELIST_MINT_PER_PERSON)
            revert("Max mint amount will be exceeded");

        mintedTokens[msg.sender] += quantity;

        if (mintedTokens[msg.sender] == MAX_WHITELIST_MINT_PER_PERSON) {
            whitelistClaimed[msg.sender] = true;
        }

        _safeMint(msg.sender, quantity);
    }

    function mint(uint256 quantity) public payable {
        require(
            publicStartTime >= block.timestamp,
            "public mint has not started"
        );
        require(
            quantity <= MAX_PUBLIC_MINT_PER_PERSON,
            "max mint amount exceeded"
        );
        require(
            msg.value >= quantity * PUBLIC_COST,
            "Please spend minimum price"
        );
        require(!publicClaimed[msg.sender], "Address has already claimed max");

        if (mintedTokens[msg.sender] + quantity > MAX_PUBLIC_MINT_PER_PERSON)
            revert("Max mint amount will be exceeded");

        mintedTokens[msg.sender] += quantity;

        if (mintedTokens[msg.sender] >= MAX_PUBLIC_MINT_PER_PERSON) {
            publicClaimed[msg.sender] = true;
        }

        _safeMint(msg.sender, quantity);
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

    function getBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    /*---------------------------
        ownly owner functions
    ----------------------------*/

    function setBaseURI(string memory _baseUri) public onlyOwner {
        baseUri = _baseUri;
    }

    function setMerkleRoot(bytes32 merkleRoot_) public onlyOwner {
        merkleRoot = merkleRoot_;
    }

    function withdrawEth() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool sent, bytes memory data) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
        // emit Withdrawn(amount);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length != 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }

    /*---------------------------
        internal functions
    ----------------------------*/

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
}
