const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { constants, fastForward } = require("./constants.test");
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

// let whiteListStartTime = constants.TEST.oneDay + 1648033737;
// let publicStartTime = constants.TEST.oneMonth + 1648033737;
// Merkel Root
// 0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea
describe("tests", function () {

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        notWhiteListed = accounts[14];

        timestamp = await (await ethers.provider.getBlock("latest")).timestamp;
        whiteListStartTime = constants.TEST.oneDay + 1648033737;
        publicStartTime = constants.TEST.oneMonth + 1648033737;

        CoreContract = await ethers.getContractFactory("ProfilePic");
        NftPfp = await CoreContract.connect(owner).deploy(
            "/testUri/",
            "/testHiddenUri/",
            whiteListStartTime,
            publicStartTime,
            "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
            );

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
            // expect(await NftPfp.whiteListMintOpen()).to.equal(false);
            // expect(await NftPfp.publicMintOpen()).to.equal(false);
            expect(await NftPfp.whiteListCost()).to.equal(parseEther("0.002"));
            expect(await NftPfp.publicCost()).to.equal(parseEther("0.004"));
        });
    });

    describe("State changing functions", function () {

        it("whiteList address can mint single NFT", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") }
            );
            expect(await NftPfp.totalSupply()).to.equal(1);
        });

        it("whiteList address can mint multiple NFTs", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                4, buyer1MerkleProof,
                { value : parseEther("0.008") }
            );
            expect(await NftPfp.totalSupply()).to.equal(4);
            expect(await NftPfp.balanceOf(signerWallet1.address)).to.equal(4);
        });

        it("whiteList address can mint multiple times (Up to a quantity of 5)", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                2,
                buyer1MerkleProof,
                { value : parseEther("0.004") }
            );

            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                2,
                buyer1MerkleProof,
                { value : parseEther("0.004") }
            );
            
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") }
            );
        });

        it("updates whitelistClaimed mapping", async () => {
            expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(false);
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                5,
                buyer1MerkleProof,
                { value : parseEther("0.010") }
                );
            expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(true);
        });

        it("total supply updates correctly", async () => {
            expect(await NftPfp.totalSupply()).to.equal(0);
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                4,
                buyer1MerkleProof,
                { value : parseEther("0.008") }
                );
            expect(await NftPfp.totalSupply()).to.equal(4);
            await NftPfp.connect(signerWallet2).whitelistMint(
                signerWallet2.address,
                2,
                buyer2MerkleProof,
                { value : parseEther("0.004") }
                );
            expect(await NftPfp.totalSupply()).to.equal(6);
        });
        
    });

    describe("Error testing", function () {
        it("Cannot mint if whitelist is closed", async () => {

            whiteListStartTime -= constants.TEST.twoMonths;

            CoreContract = await ethers.getContractFactory("ProfilePic");
            NftPfp2 = await CoreContract.connect(owner).deploy(
            "/testUri/",
            "/testHiddenUri/",
            whiteListStartTime,
            publicStartTime,
            "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
            );
            
            //await (await ethers.provider.getBlock("latest")).timestamp + constants.TEST.twoMonths;
            //whiteListStartTime -= constants.TEST.twoMonths;
            await expect(NftPfp2.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") })
            )
            .to.be.revertedWith(
                "whitelist mint has not started"
                );
        });

        it("Error test on initialising", async () => {
            await expect(NftPfp.connect(signerWallet1).balanceOf(ethers.constants.AddressZero)).to.be.revertedWith(
                'BalanceQueryForZeroAddress()'
                );
        });

        it("cant mint more than max mint amount (5)", async () => {
            await expect(NftPfp.connect(signerWallet1).whitelistMint(signerWallet1.address, 6, buyer1MerkleProof, { value : parseEther("0.012") }))
            .to.be.revertedWith(
                "max mint amount exceeded"
                );
        });

        it("address already claimed", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                5,
                buyer1MerkleProof,
                { value : parseEther("0.010") }
            );
            await expect(NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") })
            )
            .to.be.revertedWith(
                "Address has already claimed"
                );
        });
        
        it("nonWhiteListed address cannot claim", async () => {
            await expect(NftPfp.connect(notWhiteListed).whitelistMint(
                notWhiteListed.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") })
            )
            .to.be.revertedWith(
                "Invalid Proof"
                );
        });

        it("incorrect value sent for purchase", async () => {
            await expect(NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                2,
                buyer1MerkleProof,
                { value : parseEther("0.002") } )
            )
            .to.be.revertedWith(
                "Please spend minimum price"
                );
        });
    });
    
}); 