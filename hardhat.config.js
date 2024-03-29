require("@nomiclabs/hardhat-waffle");
const fs = require("fs");

const privateKey = fs.readFileSync(".secret", "utf8").toString();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      accounts : [privateKey]
    },
    rinkeby: {
      url: "*****place your node url here*****",
      accounts : [privateKey]
    },
    mainnet: {
      url: "wss://ws-matic-mainnet.chainstacklabs.com",
      accounts: [privateKey]
    },
  },
  solidity: "0.8.4",
};
