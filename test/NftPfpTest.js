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

// Merkel Root
// 0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea

describe("NftPfP tests", function () {

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        notWhiteListed = accounts[14];
        notWhiteListed2 = accounts[15];

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
    
    describe("initialization tests", function () {

        it("initializes properly", async function () {
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
            expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(false);
            expect(await NftPfp.publicClaimed(notWhiteListed.address)).to.equal(false);
            expect(await NftPfp.mintedTokens(signerWallet1.address)).to.equal(0);
            expect(await NftPfp.mintedTokens(notWhiteListed.address)).to.equal(0);
            expect(await NftPfp.whiteListCost()).to.equal(parseEther("0.002"));
            expect(await NftPfp.publicCost()).to.equal(parseEther("0.004"));
            expect(await NftPfp.getStartingID()).to.equal(0);
        });

        describe("Initialization error testing", function () {
            it("BalanceQueryForZeroAddress", async () => {
                await expect(NftPfp.connect(signerWallet1).balanceOf(
                    ethers.constants.AddressZero
                    )
                    ).to.be.revertedWith('BalanceQueryForZeroAddress()');
            });
        });
    });

    describe("WhiteList tests", function () {
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

            it("can whiteListMint to different address than signer", async () => {
                await NftPfp.connect(signerWallet1).whitelistMint(
                    signerWallet2.address,
                    2,
                    buyer2MerkleProof,
                    { value : parseEther("0.004") }
                    );
                expect(await NftPfp.mintedTokens(signerWallet2.address)).to.equal(2);
            }); 
        });

        describe("Whitelist error testing", function () {
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

            it("signer cant whiteListMint to non whitelisted address", async () => {
                await expect(NftPfp.connect(signerWallet1).whitelistMint(
                    notWhiteListed.address,
                    2,
                    buyer2MerkleProof,
                    { value : parseEther("0.004") }
                    )
                ).to.be.revertedWith("Invalid Proof");
            })  

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

            it("MintedQueryForZeroAddress", async () => {
                await expect(NftPfp.numberMinted(ethers.constants.AddressZero))
                .to.be.revertedWith("MintedQueryForZeroAddress()")
            });
        });
    });

    describe("public mint tests", function () {
        describe("state changing functions", function () {
            
            it("mint", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    1,
                    { value : parseEther("0.004") }
                );
            expect(await NftPfp.totalSupply()).to.equal(1);
            expect(await NftPfp.mintedTokens(notWhiteListed.address)).to.equal(1);
            });

            it("updates publicClaimed mapping", async () => {
                expect(await NftPfp.publicClaimed(notWhiteListed.address)).to.equal(false);
                await NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    3,
                    { value : parseEther("0.012") }
                    );
                expect(await NftPfp.publicClaimed(notWhiteListed.address)).to.equal(true);
            });

            it("can mint multiple times (up to a max of 3)", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    1,
                    { value : parseEther("0.004") }
                );
                await NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    1,
                    { value : parseEther("0.004") }
                );
                await NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    1,
                    { value : parseEther("0.004") }
                );
                it("mint updates total supply correctly", async () => {
                    expect(await NftPfp.totalSupply()).to.equal(0);
                    await NftPfp.connect(notWhiteListed).mint(
                        notWhiteListed.address,
                        1,
                        { value : parseEther("0.004") }
                        );
                    expect(await NftPfp.totalSupply()).to.equal(1);
                    await NftPfp.connect(notWhiteListed2).mint(
                        notWhiteListed2.address,
                        2,
                        { value : parseEther("0.008") }
                        );
                    expect(await NftPfp.totalSupply()).to.equal(3);
                });
                
                it("can mint to different address than signer", async () => {
                    await NftPfp.connect(notWhiteListed2).mint(
                        notWhiteListed1.address,
                        2,
                        { value : parseEther("0.008") }
                        );
                    expect(await NftPfp.mintedTokens(notWhiteListed1.address)).to.equal(2);
                });
            });
        });
        describe("error tests", function() {
            it("public mint has not started", async () => {
                publicStartTime -= constants.TEST.twoMonths;

                CoreContract = await ethers.getContractFactory("ProfilePic");
                NftPfp3 = await CoreContract.connect(owner).deploy(
                "/testUri/",
                "/testHiddenUri/",
                whiteListStartTime,
                publicStartTime,
                "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
                );

                await expect(NftPfp3.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    1,
                    { value : parseEther("0.004") })
                )
                .to.be.revertedWith(
                    "public mint has not started"
                    );
            });

            it("max mint amount exceeded", async () => {
                await expect(NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    4,
                    { value : parseEther("0.016") }
                    )
                ).to.be.revertedWith("max mint amount exceeded");
            });

            it("Please spend minimum price", async () => {
                await expect(NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    1,
                    { value : parseEther("0.002") }
                    )
                ).to.be.revertedWith("Please spend minimum price");
            });

            it("Address has already claimed max", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    3,
                    { value : parseEther("0.012") }
                );

                await expect(NftPfp.connect(notWhiteListed).mint(
                    notWhiteListed.address,
                    3,
                    { value : parseEther("0.012") }
                    )
                ).to.be.revertedWith("Address has already claimed max")
                
            })
        });
    });

    describe("View function tests", function () {
        it("number minted updates correctly", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                2,
                buyer1MerkleProof,
                { value : parseEther("0.004") }
            );
            expect(await NftPfp.numberMinted(signerWallet1.address)).to.equal(2);
            expect(await NftPfp.numberMinted(signerWallet2.address)).to.equal(0);
        });

        it("getTokenID retruns correct value", async () => {
            expect(await NftPfp.getTokenID()).to.equal(0);

            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") }
            );

            expect(await NftPfp.getTokenID()).to.equal(1);

            await NftPfp.connect(signerWallet2).whitelistMint(
                signerWallet2.address,
                1,
                buyer2MerkleProof,
                { value : parseEther("0.002") }
            );

            expect(await NftPfp.getTokenID()).to.equal(2);

            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                3,
                buyer1MerkleProof,
                { value : parseEther("0.006") }
            );

            expect(await NftPfp.getTokenID()).to.equal(5);
        });

        it("getOwnerOf return correct address", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                signerWallet1.address,
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") }
            )
            expect(await NftPfp.getOwnerOf(0)).to.equal(signerWallet1.address);

            await NftPfp.connect(notWhiteListed).mint(
                notWhiteListed2.address,
                2,
                { value : parseEther("0.008") }
            );
            expect(await NftPfp.getOwnerOf(2)).to.equal(notWhiteListed2.address);
        });
    });
    
}); 