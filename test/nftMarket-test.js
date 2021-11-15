const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should create an auction, place a bid, wait until the auction finishes and claim the token" , async function () {
    //Arange
    const MarketContract = await ethers.getContractFactory("NFTMarket");
    const market = await MarketContract.deploy();
    await market.deployed();

    const marketAddress = await market.address;
    const NFTContract = await ethers.getContractFactory("NFT");
    const nft = await NFTContract.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = await nft.address;

    await nft.createToken("www.faketokenlocation.com");

    //here we will get the timestamp (in seconds) for 24 hours from now
    const auctionEnd = (Math.floor(Date.now() / 1000)) + 10;

    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), auctionEnd);

    let auction = await market.getAuctionItem(1);

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.002", "ether")});

    auction = await market.getAuctionItem(1);
    expect(auction.highestBid).to.equal(ethers.utils.parseUnits("0.002", "ether"));
    expect(auction.highestBidder).to.equal(secondAddress.address);
    while ((Math.floor(Date.now() / 1000)) < auctionEnd) {
      console.log(`waiting for auction to finish...`);
      await wait(1000);
    };

    const claimTx = await market.connect(secondAddress).claimAuctionItem(1);
  });

  it("Should create and execute market sales", async function () {
    // Arrange
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


    // Act
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

    // assert
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
    //Arange
    const MarketContract = await ethers.getContractFactory("NFTMarket");
    const market = await MarketContract.deploy();
    await market.deployed();

    const marketAddress = await market.address;
    const NFTContract = await ethers.getContractFactory("NFT");
    const nft = await NFTContract.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = await nft.address;

    await nft.createToken("www.faketokenlocation.com");

    //here we will get the timestamp (in seconds) for 24 hours from now
    const auctionEnd = (Math.floor(Date.now() / 1000)) + 86400;
    //const auctionEndsAt = ethers.BigNumber.from(timestamp);

    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), auctionEnd);

    let auction = await market.getAuctionItem(1);
    console.log(`auction created: ${JSON.stringify(auction)}`);

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.002", "ether")});

    auction = await market.getAuctionItem(1);
    console.log(`auction updated: ${JSON.stringify(auction)}`);
    expect(auction.highestBid).to.equal(ethers.utils.parseUnits("0.002", "ether"));
    expect(auction.highestBidder).to.equal(secondAddress.address);
  });

  it("When trying to create an auction with an invalid end date, it should fail with the proper error message" , async function () {
    //Arange
    const MarketContract = await ethers.getContractFactory("NFTMarket");
    const market = await MarketContract.deploy();
    await market.deployed();

    const marketAddress = await market.address;
    const NFTContract = await ethers.getContractFactory("NFT");
    const nft = await NFTContract.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = await nft.address;

    await nft.createToken("www.faketokenlocation.com");

    //here we will get the timestamp for 24 hours from now
    const auctionEnd = (Math.floor(Date.now() / 1000)) - 86400;

    try {
      //act
      await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), auctionEnd);
      expect(false).to.be.true;
    } catch (error) {
      //assert
      expect(error.message).contains("auctionEnd must be in the future");
    }
    
  });

  it("Should create an auction, place a bid, try to claim, and fail with the proper error" , async function () {
    //Arange
    const MarketContract = await ethers.getContractFactory("NFTMarket");
    const market = await MarketContract.deploy();
    await market.deployed();

    const marketAddress = await market.address;
    const NFTContract = await ethers.getContractFactory("NFT");
    const nft = await NFTContract.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = await nft.address;

    await nft.createToken("www.faketokenlocation.com");

    //here we will get the timestamp (in seconds) for 24 hours from now
    const auctionEnd = (Math.floor(Date.now() / 1000)) + 86400;
    //const auctionEndsAt = ethers.BigNumber.from(timestamp);

    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), auctionEnd);

    let auction = await market.getAuctionItem(1);
    console.log(`auction created: ${JSON.stringify(auction)}`);

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.002", "ether")});

    auction = await market.getAuctionItem(1);
    console.log(`auction updated: ${JSON.stringify(auction)}`);
    expect(auction.highestBid).to.equal(ethers.utils.parseUnits("0.002", "ether"));
    expect(auction.highestBidder).to.equal(secondAddress.address);

    try {
      await market.connect(secondAddress).claimAuctionItem(1);
      expect(false).to.be.true;
    } catch (error) {
      //assert
      expect(error.message).contains("Auction has not ended");
    }
  });
});

async function wait(ms) {
	return await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
