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
        whiteListStartTime = constants.TEST.oneDay + timestamp;
        publicStartTime = constants.TEST.oneMonth + timestamp;

        CoreContract = await ethers.getContractFactory("ProfilePic");
        NftPfp = await CoreContract.connect(owner).deploy(
            whiteListStartTime,
            publicStartTime,
            );
        
        await NftPfp.connect(owner).setMerkleRoot(
            "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
        );

    });
    
    describe("initialization tests", function () {

        it("initializes properly", async function () {
            expect(await NftPfp.owner()).to.be.equal(owner.address);
            expect(await NftPfp.name()).to.be.equal("TestPfp");
            expect(await NftPfp.symbol()).to.be.equal("TPFP");
            expect(await NftPfp.baseUri()).to.be.equal("");
            expect(await NftPfp.SUPPLY()).to.equal(100);
            expect(await NftPfp.MAX_WHITELIST_MINT_PER_PERSON()).to.equal(5);
            expect(await NftPfp.MAX_PUBLIC_MINT_PER_PERSON()).to.equal(3);
            expect(await NftPfp.totalSupply()).to.equal(0);
            expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(false);
            expect(await NftPfp.publicClaimed(notWhiteListed.address)).to.equal(false);
            expect(await NftPfp.mintedTokens(signerWallet1.address)).to.equal(0);
            expect(await NftPfp.mintedTokens(notWhiteListed.address)).to.equal(0);
            expect(await NftPfp.WHITELIST_COST()).to.equal(parseEther("0.002"));
            expect(await NftPfp.PUBLIC_COST()).to.equal(parseEther("0.004"));
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
                    1,
                    buyer1MerkleProof,
                    { value : parseEther("0.002") }
                );
                expect(await NftPfp.totalSupply()).to.equal(1);
            });

            it("whiteList address can mint multiple NFTs", async () => {
                await NftPfp.connect(signerWallet1).whitelistMint(
                    4, 
                    buyer1MerkleProof,
                    { value : parseEther("0.008") }
                );
                expect(await NftPfp.totalSupply()).to.equal(4);
                expect(await NftPfp.balanceOf(signerWallet1.address)).to.equal(4);
            });

            it("whiteList address can mint multiple times (Up to a quantity of 5)", async () => {
                await NftPfp.connect(signerWallet1).whitelistMint(
                    2,
                    buyer1MerkleProof,
                    { value : parseEther("0.004") }
                );

                await NftPfp.connect(signerWallet1).whitelistMint(
                    2,
                    buyer1MerkleProof,
                    { value : parseEther("0.004") }
                );
                
                await NftPfp.connect(signerWallet1).whitelistMint(
                    1,
                    buyer1MerkleProof,
                    { value : parseEther("0.002") }
                );
            });

            it("updates whitelistClaimed mapping", async () => {
                expect(await NftPfp.whitelistClaimed(signerWallet1.address)).to.equal(false);
                await NftPfp.connect(signerWallet1).whitelistMint(
                    5,
                    buyer1MerkleProof,
                    { value : parseEther("0.010") }
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
            });
        });

        describe("Whitelist error testing", function () {
            it("Cannot mint if whitelist is closed", async () => {

                whiteListStartTime -= constants.TEST.twoMonths;

                CoreContract = await ethers.getContractFactory("ProfilePic");
                NftPfp2 = await CoreContract.connect(owner).deploy(
                whiteListStartTime,
                publicStartTime,
                );
                await NftPfp2.connect(owner).setMerkleRoot(
                    "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
                );
                
                await expect(NftPfp2.connect(signerWallet1).whitelistMint(
                    1,
                    buyer1MerkleProof,
                    { value : parseEther("0.002") })
                )
                .to.be.revertedWith(
                    "WhitelistMintNotOpen()"
                    );
            });

            it("cant mint more than max mint amount (5)", async () => {
                await expect(NftPfp.connect(signerWallet1).whitelistMint(
                    6,
                    buyer1MerkleProof,
                    { value : parseEther("0.012") })
                )
                .to.be.revertedWith(
                    "MaxMintAmountExceeded()"
                    );
            });

            it("cant incrementally mint more than max amount (5)", async () => {
                await NftPfp.connect(signerWallet1).whitelistMint( 
                    4,
                    buyer1MerkleProof,
                    { value : parseEther("0.012") }
                );

                await expect(NftPfp.connect(signerWallet1).whitelistMint( 
                    4,
                    buyer1MerkleProof,
                    { value : parseEther("0.012") }
                )).to.be.revertedWith("MaxAmountWillBeExceeded()")
                    
            });

            it("address already claimed", async () => {
                await NftPfp.connect(signerWallet1).whitelistMint(
                    5,
                    buyer1MerkleProof,
                    { value : parseEther("0.010") }
                );
                await expect(NftPfp.connect(signerWallet1).whitelistMint(
                    1,
                    buyer1MerkleProof,
                    { value : parseEther("0.002") })
                )
                .to.be.revertedWith(
                    "MaxClaimed()"
                    );
            });
            
            it("nonWhiteListed address cannot claim", async () => {
                await expect(NftPfp.connect(notWhiteListed).whitelistMint(
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
                    2,
                    buyer1MerkleProof,
                    { value : parseEther("0.002") } )
                )
                .to.be.revertedWith(
                    "SpendMinimumPrice()"
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
                    1,
                    { value : parseEther("0.004") }
                );
            expect(await NftPfp.totalSupply()).to.equal(1);
            expect(await NftPfp.mintedTokens(notWhiteListed.address)).to.equal(1);
            });

            it("updates publicClaimed mapping", async () => {
                expect(await NftPfp.publicClaimed(notWhiteListed.address)).to.equal(false);
                await NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                    );
                expect(await NftPfp.publicClaimed(notWhiteListed.address)).to.equal(true);
            });

            it("can mint multiple times (up to a max of 3)", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    1,
                    { value : parseEther("0.004") }
                );
                await NftPfp.connect(notWhiteListed).mint(
                    1,
                    { value : parseEther("0.004") }
                );
                await NftPfp.connect(notWhiteListed).mint(
                    1,
                    { value : parseEther("0.004") }
                );

                it("mint updates total supply correctly", async () => {
                    expect(await NftPfp.totalSupply()).to.equal(0);
                    await NftPfp.connect(notWhiteListed).mint(
                        1,
                        { value : parseEther("0.004") }
                        );
                    expect(await NftPfp.totalSupply()).to.equal(1);
                    await NftPfp.connect(notWhiteListed2).mint(
                        2,
                        { value : parseEther("0.008") }
                        );
                    expect(await NftPfp.totalSupply()).to.equal(3);
                });
                
                it("can mint to different address than signer", async () => {
                    await NftPfp.connect(notWhiteListed2).mint(
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
                whiteListStartTime,
                publicStartTime,
                );

                await NftPfp3.connect(owner).setMerkleRoot(
                    "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
                );

                await expect(NftPfp3.connect(notWhiteListed).mint(
                    1,
                    { value : parseEther("0.004") })
                )
                .to.be.revertedWith(
                    "PublicMintNotOpen()"
                    );
            });

            it("max mint amount exceeded", async () => {
                await expect(NftPfp.connect(notWhiteListed).mint(
                    4,
                    { value : parseEther("0.016") }
                    )
                ).to.be.revertedWith("MaxMintAmountExceeded()");
            });

            it("cannot mint more than max amount incrementally", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    2,
                    { value : parseEther("0.008") }
                );
                
                await expect(NftPfp.connect(notWhiteListed).mint(
                    2,
                    { value : parseEther("0.008") }
                    )
                ).to.be.revertedWith("MaxAmountWillBeExceeded()");
            });

            it("Please spend minimum price", async () => {
                await expect(NftPfp.connect(notWhiteListed).mint(
                    1,
                    { value : parseEther("0.002") }
                    )
                ).to.be.revertedWith("SpendMinimumPrice()");
            });

            it("Address has already claimed max", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                );

                await expect(NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                    )
                ).to.be.revertedWith("MaxClaimed()")
                
            })
        });
    });

    describe("transfer tests", function () {
        describe("state changing functions", function () {
            it("owner can transfer", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                );

                expect(await NftPfp.getOwnerOf(0)).to.equal(notWhiteListed.address);

                await NftPfp.connect(notWhiteListed).transfer(
                    notWhiteListed.address,
                    notWhiteListed2.address,
                    0
                );

                expect(await NftPfp.getOwnerOf(0)).to.equal(notWhiteListed2.address);
                expect(await NftPfp.balanceOf(notWhiteListed.address)).to.equal(2);
                expect(await NftPfp.balanceOf(notWhiteListed2.address)).to.equal(1);

            });
        });

        describe("error tests", function () {
            it("non owner cannot transfer", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                );

                await expect(NftPfp.connect(notWhiteListed2).transfer(
                    notWhiteListed.address,
                    notWhiteListed2.address,
                    0
                )
                ).to.be.revertedWith("TransferCallerNotOwnerNorApproved()");
            });

            it("transfer from address is incorrect owner", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                );

                await expect(NftPfp.connect(notWhiteListed).transfer(
                    notWhiteListed2.address,
                    signerWallet1.address,
                    0
                )
                ).to.be.revertedWith("TransferFromIncorrectOwner()");
            });

            it("cannot transfer to zero address", async () => {
                await NftPfp.connect(notWhiteListed).mint(
                    3,
                    { value : parseEther("0.012") }
                );

                await expect(NftPfp.connect(notWhiteListed).transfer(
                    notWhiteListed.address,
                    ethers.constants.AddressZero,
                    0
                )
                ).to.be.revertedWith("TransferToZeroAddress()");
            });
        });
    });

    describe("View function tests", function () {
        it("number minted updates correctly", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                2,
                buyer1MerkleProof,
                { value : parseEther("0.004") }
            );
            expect(await NftPfp.numberMinted(signerWallet1.address)).to.equal(2);
            expect(await NftPfp.numberMinted(signerWallet2.address)).to.equal(0);
        });

        it("getOwnerOf return correct address", async () => {
            await NftPfp.connect(signerWallet1).whitelistMint(
                1,
                buyer1MerkleProof,
                { value : parseEther("0.002") }
            )
            expect(await NftPfp.getOwnerOf(0)).to.equal(signerWallet1.address);

            await NftPfp.connect(notWhiteListed).mint(
                2,
                { value : parseEther("0.008") }
            );
            expect(await NftPfp.getOwnerOf(2)).to.equal(notWhiteListed.address);
        });
    });

    describe("internal functions", function () {
        describe("state changing functions", function () {
            it("tokenUri returns correctly", async () => {
                await NftPfp.connect(owner).setBaseURI("/testUri/");
                await NftPfp.connect(notWhiteListed).mint(
                    2,
                    { value : parseEther("0.008") }
                );
                expect(await NftPfp.connect(owner).tokenURI(0)).to.equal("/testUri/0.json");
            });
        });
        describe("error tests", function () {
            it("only owner can set baseUri", async () => {
                await expect(NftPfp.connect(signerWallet1).setBaseURI("ACDC"))
                .to.be.revertedWith("Ownable: caller is not the owner")
            });
        });
        
    });

    describe("Only Owner tests", function () {
        it("Only owner can call setMerkleRoot", async () => {
            await expect(NftPfp.connect(signerWallet1).setMerkleRoot(
                "0x59b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea"
            )).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("only owner can withdraw eth", async () => {
            await NftPfp.connect(signerWallet1).mint(
                1,
                { value : parseEther("0.004")}
            );
            await expect(
                NftPfp.connect(signerWallet1).withdrawEth()
            ).to.be.revertedWith("Ownable: caller is not the owner");

            let balanceBefore = await NftPfp.connect(owner).getBalance();
            
            expect(balanceBefore).to.equal(parseEther("0.004"));

            await NftPfp.connect(owner).withdrawEth();

            let balanceAfter = await NftPfp.connect(owner).getBalance();

            expect(balanceAfter).to.equal(0);

        });
        it("only owner can call tokenUri", async () => {
            await expect(NftPfp.connect(signerWallet1).tokenURI(0))
            .to.be.revertedWith("Ownable: caller is not the owner");
        })
    });

    describe("event tests", () => {
        it("emits WhitelistMinted", async () => {
          await expect(NftPfp.connect(signerWallet1).whitelistMint(
              1,
              buyer1MerkleProof,
              { value : parseEther("0.002")}
              )
            ).to.emit(NftPfp, "WhitelistMinted")
            .withArgs(signerWallet1.address, 1);
        });

        it("emits Minted", async () => {
            await expect(NftPfp.connect(notWhiteListed).mint(
                1,
                { value : parseEther("0.004")}
                )
              ).to.emit(NftPfp, "Minted")
              .withArgs(notWhiteListed.address, 1);
          });

          it("emits Transfered", async () => {
            await NftPfp.connect(notWhiteListed).mint(
                1,
                { value : parseEther("0.004")});
            
            await expect(NftPfp.connect(notWhiteListed).transfer(
                notWhiteListed.address,
                signerWallet1.address,
                0)
            ).to.emit(NftPfp, "Transfered").withArgs(
                notWhiteListed.address,
                signerWallet1.address,
                0
                );
          });

          it("emits Withdrawn", async () => {
            await NftPfp.connect(notWhiteListed).mint(
                2,
                { value : parseEther("0.008") }
            );
            await expect(NftPfp.connect(owner).withdrawEth()).to.emit
            (NftPfp, "Withdrawn").withArgs(parseEther("0.008"));
          });
    }); 
});