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
  const [auctionsToClaim, setAuctionsToClaim] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, provider);

    const auctionsPromise = loadAuctions(marketContract, tokenContract);

    await Promise.all([auctionsPromise]);
    setLoadingState('loaded');
  };


  async function loadAuctions(marketContract, tokenContract) {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.listAccounts();
    const address = String(signer);

    const auctions = await marketContract.getAuctionClaims(address);
    console.log(`auctions.lengh ${auctions.length}`)
    const items = await Promise.all(auctions.map(async (i) => {
      console.log(`obj keys: ${Object.keys(i)}`);
      const tokenUri = await tokenContract.tokenURI(i.itemId);
      console.log(`tokenUri: ${tokenUri}`);
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

    setAuctionsToClaim(items);
  };

  async function claim(auction) {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);

    const transaction = await marketContract.claimAuctionItem(auction.itemId);

    await transaction.wait();

    load();
  }

  if (loadingState === "loaded" && !auctionsToClaim.length) {
    return (
      <h1 className="text-center">No auctions to claim</h1>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {auctionsToClaim.map((auction, i) => {
            let auctionEndDate = ethers.BigNumber.from(auction.auctionEnd).toNumber();
            auctionEndDate = new Date(auctionEndDate * 1000);
            auctionEndDate = auctionEndDate.getTime();
            auctionEndDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(auctionEndDate);
            return (
              <div key={i} className="bg-grey rounded shadow-md p-4">
                <img src={auction.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text text-white">Starting Price: {auction.startingPrice} {currency}</p>
                  <p className="text text-white">Highest Bid: {auction.highestBid} ${currency}</p>
                </div>
                <div className="p-4 bg-red-500">
                  <p className="text text-white">Auction Ended at: {auctionEndDate}</p>
                  <div className="border-b-2 border-black-500"></div>
                  <p className="text text-white">Highest Bidder: {auction.highestBidder}</p>
                </div>
                <div className="p-4 bg-black">
                  <button className="w-full bg-red-500 text-white font-bold py-2 px-12 rounded" onClick={() => claim(auction)}>CLAIM</button>
                </div>
              </div>)
          }
          )}
        </div>
      </div>
    </div>
  )
}
