const { constants } = require("../test/constants.test");

async function main() {
    
    let timestamp = await (await ethers.provider.getBlock("latest")).timestamp;
    let whiteListStartTime = constants.TEST.oneDay + timestamp;
    let publicStartTime = constants.TEST.oneMonth + timestamp;
    const CoreContract = await ethers.getContractFactory("ProfilePic");
    
    const coreInstance = await CoreContract.deploy(
        whiteListStartTime,
        publicStartTime
        );
  
    await coreInstance.deployed();
  
    console.log("NFT Profile Picture Contract deployed to: ", coreInstance.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  