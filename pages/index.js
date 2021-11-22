import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

import loadConfig from "./loadConfig";

export async function getStaticProps() {
  const config = await loadConfig();
  return {props: config};
}

export default function Home(config) {
  const network = config.network;
  const nftAddress = config.deployments[network].nftContract;
  const nftMarketAddress = config.deployments[network].nftMarketplace;
  const providerUrl = config.web3Providers[network].url;
  const currency = config.currency[network] || "MATIC";
  const [nfts, setNfts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [auctionBids, _] = useState({});
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    load();
  }, []);

  function saveAuctionBidState({auctionId, bid}) {
    auctionBids[auctionId] = bid;
  }

  async function load() {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, provider);

    const nftDirectalesPromise = loadMarketOffers(marketContract, tokenContract);
    const auctionsPromise = loadAuctions(marketContract, tokenContract);

    await Promise.all([nftDirectalesPromise, auctionsPromise]);
    setLoadingState('loaded');
  };

  async function loadMarketOffers(marketContract, tokenContract) {

    const availableItems = await marketContract.getAvailableMarketItems();

    const items = await Promise.all(availableItems.map(async (i) => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const metadata = await axios.get(tokenUri);
      let price = ethers.utils.formatUnits(i.price.toString(), "ether");
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: metadata && metadata.data && metadata.data.image,
        name: metadata && metadata.data && metadata.data.name,
        description: metadata && metadata.data.description,
      }

      return item;
    }));

    setNfts(items);
  }

  async function loadAuctions(marketContract, tokenContract) {
    const auctions = await marketContract.getOngoingAuctions();
    const items = await Promise.all(auctions.map(async (i) => {
      const tokenUri = await tokenContract.tokenURI(i.itemId);
      const metadata = await axios.get(tokenUri);
      let startingPrice = ethers.utils.formatUnits(i.startingPrice.toString(), "ether");
      let highestBid = ethers.utils.formatUnits(i.highestBid.toString(), "ether");
      let highestBidder = i.highestBidder;

      return {
        itemId: i.itemId,
        image: metadata && metadata.data && metadata.data.image,
        name: metadata && metadata.data && metadata.data.name,
        startingPrice,
        highestBid,
        auctionId: i.auctionId,
        auctionEnd: i.auctionEnd,
        claimed: i.claimed,
        highestBidder
      };
    }));

    setAuctions(items);
  };

  async function buyNft(nft) {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await marketContract.createMarketSale(nftAddress, nft.tokenId, { value: price });

    await transaction.wait();

    load();
  }

  async function placeBid(auction) {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    const bid = auctionBids[auction.auctionId] || 0;
    const bidAmount = ethers.utils.parseUnits(bid.toString(), "ether");

    const transaction = await marketContract.placeBid(auction.itemId, bidAmount, { value: bidAmount });

    await transaction.wait();

    load();
  }

  if (loadingState === "loaded" && !nfts.length && !auctions.length) {
    return (
      <h1 className="text-center">No NFTs sales or auctions available</h1>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => {
              return (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={nft.image} />
                  <div className="p-4">
                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                    <div style={{ height: '70px', overflow: 'hidden' }}>
                      <p className="text-black-400">{nft.description}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} {currency}</p>
                    <button className="w-full bg-red-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Purchase item</button>
                  </div>
                </div>
              )
            })
          }
          {auctions.map((auction, i) => {
            let auctionEndDate = ethers.BigNumber.from(auction.auctionEnd).toNumber();
            auctionEndDate = new Date(auctionEndDate * 1000);
            auctionEndDate = auctionEndDate.getTime();
            auctionEndDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(auctionEndDate);
            return (
              <div key={i} className="bg-grey rounded shadow-md p-4">
                <img src={auction.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text text-white">Starting Price: {auction.startingPrice} {currency}</p>
                  <p className="text text-white">Highest Bid: {auction.highestBid} {currency}</p>
                </div>
                <div className="p-4 bg-red-500">
                  <p className="text text-white">Auction Ends: {auctionEndDate}</p>
                  <div className="border-b-2 border-black-500"></div>
                  <p className="text text-white">Highest Bidder: {auction.highestBidder}</p>
                </div>
                <div className="p-4 bg-black">
                  <input 
                    type="number" 
                    className="w-full bg-red-500 text-white font-bold py-2 px-12 rounded" 
                    placeholder="Enter bid amount" 
                    onChange={e => saveAuctionBidState({ auctionId: auction.auctionId, bid: e.target.value })}
                  />
                  <button className="w-full bg-red-500 text-white font-bold py-2 px-12 rounded" onClick={() => placeBid(auction)}>Place bid</button>
                </div>
              </div>)
          }
          )}
        </div>
      </div>
    </div>
  )
}
