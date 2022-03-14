const { expect } = require("chai");
const { ethers } = require("hardhat");
const { merkleProof, rootHash } = require("../scripts/merkleTree.js");

describe("tests", function () {

    beforeEach(async () => {
        [
            owner,
            whiteList1,
            whiteList2,
            whiteList3,
            whiteList4,
            whiteList5,
            whiteList6,
            whiteList7,
            whiteList8,
            nonWhiteList
        ] = await ethers.getSigners();
        CoreContract = await ethers.getContractFactory("ProfilePic");
        NftPfp = await CoreContract.connect(owner).deploy("/testUri/", "/testHiddenUri/");
    });
    
    describe("initialises properly", function () {

        it.only("initialisation tests", async function () {
            expect(await NftPfp.owner()).to.be.equal(owner.address);
            expect(await NftPfp.name()).to.be.equal("TestPfp");
            expect(await NftPfp.symbol()).to.be.equal("TPFP");
            expect(await NftPfp.baseUri()).to.be.equal("/testUri/");
            expect(await NftPfp.hiddenBaseUri()).to.be.equal("/testHiddenUri/");
            expect(await NftPfp.supply()).to.equal(100);
            expect(await NftPfp.maxMintAmount()).to.equal(5);
            expect(await NftPfp.totalSupply()).to.equal(0);
            expect(await NftPfp.paused()).to.equal(true);
            expect(await NftPfp.hidden()).to.equal(true);

        });
    });

    describe("State changing functions", function () {
        it("whiteList address can mint single NFT", async () => {
            await NftPfp.connect(whiteList1).whitelistMint(1, merkleProof);
            expect(await NftPfp.totalSupply()).to.equal(1);
        });

        it("whiteList address can mint multiple NFTs", async () => {
            await NftPfp.connect(whiteList1).whitelistMint(4, merkleProof);
            expect(await NftPfp.totalSupply()).to.equal(4);
        });
        it("updates whitelistClaimed mapping", async () => {
            expect(await NftPfp.whitelistClaimed(whiteList1.address)).to.equal(false);
            await NftPfp.connect(whiteList1).whitelistMint(4, merkleProof);
            expect(await NftPfp.whitelistClaimed(whiteList1.address)).to.equal(true);
        })
        
    });

    describe("Error testing", function () {
        it("Error test on initialising", async () => {
            await expect(NftPfp.connect(whiteList1).balanceOf(ethers.constants.AddressZero)).to.be.revertedWith(
                'BalanceQueryForZeroAddress()'
                );
        });
        it("cant mint more than max mint amount (5)", async () => {
            await expect(NftPfp.connect(whiteList1).whitelistMint(6, merkleProof))
            .to.be.revertedWith(
                "max mint amount exceeded"
                );
        });
        it("address already claimed", async () => {
            await NftPfp.connect(whiteList1).whitelistMint(1, merkleProof);
            await expect(NftPfp.connect(whiteList1).whitelistMint(1, merkleProof))
            .to.be.revertedWith(
                "Address has already claimed"
                );
        });
        it("nonWhiteListed address cannot claim", async () => {
            await expect(NftPfp.connect(nonWhiteList).whitelistMint(1, merkleProof))
            .to.be.revertedWith(
                "Invalid Proof"
                );
        });
    });
    
}); 