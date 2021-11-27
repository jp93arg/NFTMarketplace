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
    const auctionEnd = (Math.floor(Date.now() / 1000)) + 5;

    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), auctionEnd);

    let auction = await market.getAuctionItem(1);

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.002", "ether")});

    auction = await market.getAuctionItem(1);
    expect(auction.highestBid).to.equal(ethers.utils.parseUnits("0.002", "ether"));
    expect(auction.highestBidder).to.equal(secondAddress.address);
    while ((Math.floor(Date.now() / 1000)) < auctionEnd) {
      console.log(`waiting for auction to finish...`);
      await wait(1500);
    };

    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");
    
    const pendingClaims = await market.getAuctionClaims(secondAddress.address);

    expect(pendingClaims.length).to.equal(1);
    expect(pendingClaims[0].auctionId).to.equal(1);
    expect(pendingClaims[0].claimed).to.equal(false);
    expect(pendingClaims[0].itemId).to.equal(1);

    await market.connect(secondAddress).claimAuctionItem(1);

    const claimedAuctions = await market.getClaimedAuctions(secondAddress.address);

    expect(claimedAuctions.length).to.equal(1);
    expect(claimedAuctions[0].auctionId).to.equal(1);
    expect(claimedAuctions[0].claimed).to.equal(true);
    expect(claimedAuctions[0].itemId).to.equal(1);
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
    }));

    const boughtItems = await market.getOwnedNFTs(buyerAddress.address);

    // assert
    expect(items.length).to.equal(1);
    expect(items[0].tokenId).to.equal("2");
    expect(boughtItems.length).to.equal(1);
    expect(boughtItems[0].tokenId).to.equal("1");
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

    await nft.createToken("www.faketokenlocation.com");
    await nft.createToken("www.faketokenlocation2.com");

    //here we will get the timestamp for 24 hours from now
    const now = new Date();
    const timestamp = now.getTime() + 86400000;


    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), timestamp);

    const auction = await market.getAuctionItem(1);
    const onGoingAuctions = await market.getOngoingAuctions();

    expect(auction.exists).to.equal(true);
    expect(auction.itemId).to.equal("1");
    expect(onGoingAuctions.length).to.equal(1);

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

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.002", "ether")});

    auction = await market.getAuctionItem(1);
    expect(auction.highestBid).to.equal(ethers.utils.parseUnits("0.002", "ether"));
    expect(auction.highestBidder).to.equal(secondAddress.address);
  });

  it("Should create Auction, place a bid but send a lower amount than the bid itself and fail with the proper error message" , async function () {
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

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    try {
      await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.001", "ether")});
      expect(false).to.be.true;
    } catch (error) {
      //assert
      expect(error.message).contains("you should transfer at least the bid amount");
    }
  });

  it("User A places a bid, then user B places a higher bid: User A should be refunded" , async function () {
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

    await market.createAuction(nftContractAddress, 1, ethers.utils.parseUnits("0.001", "ether"), auctionEnd);

    let auction = await market.getAuctionItem(1);

    const [_, secondAddress, thirdAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    const secondAddressOriginalBalance = await ethers.provider.getBalance(secondAddress.address);

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("500", "ether"), {value : ethers.utils.parseUnits("500", "ether")});

    const secondAddressUpdatedBalance = await ethers.provider.getBalance(secondAddress.address);
    expect(secondAddressUpdatedBalance.lt(secondAddressOriginalBalance)).to.equal(true);

    await market.connect(thirdAddress).placeBid(1, ethers.utils.parseUnits("700", "ether"), {value : ethers.utils.parseUnits("700", "ether")});

    const secondAddressFinalBalance = await ethers.provider.getBalance(secondAddress.address);
    expect(secondAddressFinalBalance.gt(secondAddressUpdatedBalance)).to.equal(true); // it won't be equal due to transaction fees and gas costs

    auction = await market.getAuctionItem(1);
    expect(auction.highestBid).to.equal(ethers.utils.parseUnits("700", "ether"));
    expect(auction.highestBidder).to.equal(thirdAddress.address);
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

    //here we will get the timestamp for 24 hours in the past
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

  it("Should create an auction, place a bid, try to claim before auction ends, and fail with the proper error" , async function () {
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

    const [_, secondAddress] = await ethers.getSigners(); //first address is being ignored because the contract is deployed by the first address

    await market.connect(secondAddress).placeBid(1, ethers.utils.parseUnits("0.002", "ether"), {value : ethers.utils.parseUnits("0.002", "ether")});

    auction = await market.getAuctionItem(1);
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
