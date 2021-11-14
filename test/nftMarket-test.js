const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {
    const MarketContract = await ethers.getContractFactory("NFTMarket");
    const market = await MarketContract.deploy();
    await market.deployed();

    const marketAddress = await market.address;
    const NFTContract = await ethers.getContractFactory("NFT");
    const nft = await NFTContract.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = await nft.address;

    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();
    const auctionPrice = ethers.utils.parseUnits("100", "ether");

    await nft.createToken("www.faketokenlocation.com");
    await nft.createToken("www.faketokenlocation2.com");

    await market.createMarketItem(nftContractAddress, 1, auctionPrice, {value : listingPrice});
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, {value : listingPrice});

    const [_, buyerAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value : auctionPrice});

    let items = await market.getAvailableMarketItems();

    items = await Promise.all(items.map(async (i) => {
      const tokenUri = await nft.tokenURI(i.tokenId);
      const item =  {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item;
    }))

    console.log(items);
  });
});
