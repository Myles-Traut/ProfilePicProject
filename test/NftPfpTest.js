const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { 
    walletAddresses,
    signerWallet1,
    signerWallet2, 
    buyer1MerkleProof,
    buyer2MerkleProof,
    buyer3MerkleProof,
    buyer4MerkleProof,
    buyer5MerkleProof,
    buyer6MerkleProof,
    buyer7MerkleProof,
    buyer8MerkleProof 
} = require("../scripts/merkleTree.js");

describe("tests", function () {

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        notWhiteListed = accounts[14];

        CoreContract = await ethers.getContractFactory("ProfilePic");
        NftPfp = await CoreContract.connect(owner).deploy("/testUri/", "/testHiddenUri/");

    });
    
    describe("initialises properly", function () {
        it("initialisation tests", async function () {
            expect(await NftPfp.owner()).to.be.equal(owner.address);
            expect(await NftPfp.name()).to.be.equal("TestPfp");
            expect(await NftPfp.symbol()).to.be.equal("TPFP");
            expect(await NftPfp.baseUri()).to.be.equal("/testUri/");
            expect(await NftPfp.hiddenBaseUri()).to.be.equal("/testHiddenUri/");
            expect(await NftPfp.supply()).to.equal(100);
            expect(await NftPfp.maxWhiteListMintAmount()).to.equal(5);
            expect(await NftPfp.maxPublicMintAmount()).to.equal(3);
            expect(await NftPfp.totalSupply()).to.equal(0);
            expect(await NftPfp.hidden()).to.equal(true);
            expect(await NftPfp.whiteListMintOpen()).to.equal(false);
            expect(await NftPfp.publicMintOpen()).to.equal(false);
            expect(await NftPfp.whiteListCost()).to.equal(parseEther("0.002"));
            expect(await NftPfp.publicCost()).to.equal(parseEther("0.004"));
        });
    });

    describe("State changing functions", function () {
        beforeEach(async () => {
            await NftPfp.connect(owner)._whiteListIsOpen(true);
        });

        it("whiteList address can mint single NFT", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") }
            );
            expect(await NftPfp.totalSupply()).to.equal(1);
        });

        it("whiteList address can mint multiple NFTs", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(4, buyer1MerkleProof, { value : parseEther("0.008") });
            expect(await NftPfp.totalSupply()).to.equal(4);
            expect(await NftPfp.balanceOf(signerWallet1.address)).to.equal(4);
        });

        it("updates whitelistClaimed mapping", async () => {
            expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(false);
            await NftPfp.connect(signerWallet1).whitelistMint(
                4,
                buyer1MerkleProof,
                { value : parseEther("0.008") }
                );
            expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(true);
        });
        it("total supply updates correctly", async () => {
            expect(await NftPfp.totalSupply()).to.equal(0);
            await NftPfp.connect(signerWallet1).whitelistMint(
                4,
                buyer1MerkleProof,
                { value : parseEther("0.008") }
                );
            expect(await NftPfp.totalSupply()).to.equal(4);
            await NftPfp.connect(signerWallet2).whitelistMint(
                2,
                buyer2MerkleProof,
                { value : parseEther("0.004") }
                );
            expect(await NftPfp.totalSupply()).to.equal(6);
            //console.log(roothash.toString("hex"))
        });
        
    });

    describe("Error testing", function () {
        beforeEach(async () => {
            await NftPfp.connect(owner)._whiteListIsOpen(true);
        });

        it("Cannot mint if whitelist is closed", async () => {
            await NftPfp.connect(owner)._whiteListIsOpen(false);
            await expect(NftPfp.connect(signerWallet1).whitelistMint(1, buyer1MerkleProof, { value : parseEther("0.002") }))
            .to.be.revertedWith(
                "Whitelist mint not yet open."
                );
        });

        it("Only owner can open mint", async () => {
            await expect(NftPfp.connect(notWhiteListed)._whiteListIsOpen(true))
            .to.be.revertedWith(
                "Unauthorised!"
                );
        });

        it("Error test on initialising", async () => {
            await expect(NftPfp.connect(signerWallet1).balanceOf(ethers.constants.AddressZero)).to.be.revertedWith(
                'BalanceQueryForZeroAddress()'
                );
        });

        it("cant mint more than max mint amount (5)", async () => {
            await expect(NftPfp.connect(signerWallet1).whitelistMint(6, buyer1MerkleProof, { value : parseEther("0.012") }))
            .to.be.revertedWith(
                "max mint amount exceeded"
                );
        });

        it("address already claimed", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(1, buyer1MerkleProof, { value : parseEther("0.002") });
            await expect(NftPfp.connect(signerWallet1).whitelistMint(1, buyer1MerkleProof, { value : parseEther("0.002") }))
            .to.be.revertedWith(
                "Address has already claimed"
                );
        });
        
        it("nonWhiteListed address cannot claim", async () => {
            await expect(NftPfp.connect(notWhiteListed).whitelistMint(1, buyer1MerkleProof, { value : parseEther("0.002") }))
            .to.be.revertedWith(
                "Invalid Proof"
                );
        });

        it("incorrect value sent for purchase", async () => {
            await expect(NftPfp.connect(signerWallet1).whitelistMint(2, buyer1MerkleProof, { value : parseEther("0.002") } ))
            .to.be.revertedWith(
                "Please spend minimum price"
                );
        });
    });
    
}); 