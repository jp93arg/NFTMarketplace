## NFT marketplace sample application:
Tech stack: 
Solidity, IPFS, & Next.js

This is a sample NFT marketplace project to get involved with some ERC smart contract standards like 721, and cross smart contract operations, work with balances and refund accounts, etc.

This sample project supports the following functionallities:
* Create NFT and put it for sale (direct sale)
* Purchase NFT
* List owned NFTS
* List NFTs for sale by creator
* Create NFT and put it for sale by an auction mechanism.
* Place bids
* Claim NFTs once the auction is finished

Screnshoots:
![image](https://user-images.githubusercontent.com/33181203/143785151-08ec5d94-deb9-4aa8-a1b4-ca4f1c31af49.png)

![image](https://user-images.githubusercontent.com/33181203/143785183-33fa13cb-cd67-4a1b-847a-31c1f3a01963.png)

![image](https://user-images.githubusercontent.com/33181203/143785186-834059c5-07a6-440d-8a39-24352f16049b.png)

![image](https://user-images.githubusercontent.com/33181203/143785193-65e00bda-8299-43d2-8418-9f5faef7af6e.png)

![image](https://user-images.githubusercontent.com/33181203/143785238-5e1efd00-ada6-43eb-ba8b-c9474dc2b9fc.png)

![image](https://user-images.githubusercontent.com/33181203/143785244-b3734164-08c0-48b6-9b44-53369b502143.png)

![image](https://user-images.githubusercontent.com/33181203/143785250-93df2c75-d97a-4033-b70e-ea40345c1330.png)

![image](https://user-images.githubusercontent.com/33181203/143785257-2b0a1d21-f07f-4731-8330-cae09b6569ff.png)

![image](https://user-images.githubusercontent.com/33181203/143785265-77fe7e1a-8db5-4664-b07f-026dab2636b8.png)

![image](https://user-images.githubusercontent.com/33181203/143785268-365d1b0f-7f2f-4fa8-bfae-1140c5054cf1.png)

![image](https://user-images.githubusercontent.com/33181203/143785272-e2471168-6fab-434a-b56e-a754425c8d2d.png)

![image](https://user-images.githubusercontent.com/33181203/143785279-5fdfaf1b-737b-45bc-a7ca-1ec76b87cbac.png)

![image](https://user-images.githubusercontent.com/33181203/143785308-cc06f97e-1d84-447f-9383-370e24e7a7fa.png)


#### Local setup
Running tests:
```sh
npx hardhat test
```

#### Local setup

To run this project locally, follow these steps.

1. Clone the project locally, change into the directory, and install the dependencies:

```sh
git clone https://github.com/jp93arg/NFTMarketplace.git

cd NFTMarketplace

# install using NPM or Yarn
npm install

# or

yarn
```

2. Start the local Hardhat node
More info about hardhat here: https://hardhat.org/

```sh
npx hardhat node
```

3. Configure hardhat main account
Create the `.secret` file in the root folder of the project and place the private key of the main account that hardhat will use to deploy the contracts.
Remember not to share this value with anybody. If anyone has access to the private key, it will have access to the funds that the address may have now and even in the future.

You can get the private key of your ethereum account from your wallet.
For example, if you're using metamask you can follow these steps.
- Select the acconut:
- Account details
- Export private key

![image](https://user-images.githubusercontent.com/33181203/143784954-797bd7ea-f644-42b9-8bd9-da6501ef012d.png)
![image](https://user-images.githubusercontent.com/33181203/143784969-115791eb-867b-4087-98e0-165ec420b3ff.png)



4. With the hardhat network running, deploy the contracts to the local network in a separate terminal window

```sh
npx hardhat run scripts/deploy.js --network localhost
```
5. Configure the app.
Create the .env.local file in the root folder of the project.
Add the following entries:
```
LOCAL_NFT_ADDRESS=**here you should paste the NFT contract address that the deploy command returned in the step #3**
LOCAL_NFT_MARKETPLACE_ADDRESS=**here you should paste the NFT Marketcontract address that the deploy command returned in the step #3**
NETWORK=localhost
IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
IPFS_PUBLIC_URL=https://ipfs.infura.io/ipfs
```

6. Start the app

```
npm run dev
```

### Configuration

To deploy to Ethereum/Polygon test or main networks, update the configurations located in __hardhat.config.js__ to use a private key and, optionally, deploy to a private RPC like Infura.

```javascript
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

```
