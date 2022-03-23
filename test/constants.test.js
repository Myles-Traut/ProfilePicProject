const constants = {
    one: ethers.BigNumber.from("1"),
    hundred: ethers.BigNumber.from("100"),
    oneEth: ethers.utils.parseUnits("1"),

    TEST: {
      oneDay: 86400,
      twoDays: 86400 * 2,
      oneMonth: 2629800,
      twoMonths: 2629800 * 2
    }

}

const fastForward = async (seconds) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

module.exports = {
  constants,
  fastForward
}