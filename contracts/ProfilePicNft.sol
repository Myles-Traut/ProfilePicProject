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

    // EVENTS

    event WhitelistMinted(address owner, uint256 quantity);
    event Minted(address owner, uint256 quantity);
    event Withdrawn(uint256 amount);

    // ERRORS

    error WhitelistMintNotOpen();
    error PublicMintNotOpen();
    error MaxMintAmountExceeded();
    error SpendMinimumPrice();
    error MaxClaimed();
    error InvalidProof();
    error MaxAmountWillBeExceeded();

    /*----------------------------
        State Changing Functions 
    -----------------------------*/

    // whitelistMint and mint can only mint to the signers address.
    // Minter must then use transfer() if they wish to transfer to another address.
    function whitelistMint(uint256 quantity, bytes32[] calldata _merkleProof)
        public
        payable
    {
        if (whiteListStartTime < block.timestamp) revert WhitelistMintNotOpen();
        if (quantity > MAX_WHITELIST_MINT_PER_PERSON)
            revert MaxMintAmountExceeded();
        if (msg.value < quantity * WHITELIST_COST) revert SpendMinimumPrice();
        if (whitelistClaimed[msg.sender] == true) revert MaxClaimed();

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Proof"
        );

        if (mintedTokens[msg.sender] + quantity > MAX_WHITELIST_MINT_PER_PERSON)
            revert MaxAmountWillBeExceeded();

        mintedTokens[msg.sender] += quantity;

        if (mintedTokens[msg.sender] == MAX_WHITELIST_MINT_PER_PERSON) {
            whitelistClaimed[msg.sender] = true;
        }

        _safeMint(msg.sender, quantity);

        emit WhitelistMinted(msg.sender, quantity);
    }

    function mint(uint256 quantity) public payable {
        if (publicStartTime < block.timestamp) revert PublicMintNotOpen();
        if (quantity > MAX_PUBLIC_MINT_PER_PERSON)
            revert MaxMintAmountExceeded();
        if (msg.value < quantity * PUBLIC_COST) revert SpendMinimumPrice();
        if (publicClaimed[msg.sender] == true) revert MaxClaimed();
        if (mintedTokens[msg.sender] + quantity > MAX_PUBLIC_MINT_PER_PERSON)
            revert MaxAmountWillBeExceeded();

        mintedTokens[msg.sender] += quantity;

        if (mintedTokens[msg.sender] == MAX_PUBLIC_MINT_PER_PERSON) {
            publicClaimed[msg.sender] = true;
        }

        _safeMint(msg.sender, quantity);

        emit Minted(msg.sender, quantity);
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

    function numberMinted(address holder) public view returns (uint256) {
        if (holder == address(0)) revert("MintedQueryForZeroAddress");
        return mintedTokens[holder];
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
        emit Withdrawn(amount);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        onlyOwner
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

    function _startTokenId() internal view override returns (uint256) {
        return 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
}
