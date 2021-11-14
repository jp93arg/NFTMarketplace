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

  it("Should create Auction and list" , async function () {
    const MarketContract = await ethers.getContractFactory("NFTMarket");
    const market = await MarketContract.deploy();
    await market.deployed();

    const marketAddress = await market.address;
    const NFTContract = await ethers.getContractFactory("NFT");
    const nft = await NFTContract.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = await nft.address;

    const createTokenResponse = await nft.createToken("www.faketokenlocation.com");
    console.log(`createTokenResponse: ${createTokenResponse}`);
    await nft.createToken("www.faketokenlocation2.com");

    //here we will get the timestamp for 24 hours from now
    const now = new Date();
    const timestamp = now.getTime() + 86400000;
    //const auctionEndsAt = ethers.BigNumber.from(timestamp);


    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), timestamp);

    const auction = await market.getAuctionItem(1);

    console.log(`auction: ${JSON.stringify(auction)}`);

  });

  it("Should create Auction, place a bid, and get the auction updated" , async function () {
    console.log("pending");
  });
});
