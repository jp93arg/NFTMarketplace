import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { nftAddress, nftMarketAddress } from '../config';
import styles from '../styles/Home.module.css'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs(){
    // TODO: move to .env file const providerConnection = process.env.WEB3_PROVIDER_CONNECTION;
    const provider = new ethers.providers.JsonRpcProvider("https://matic-mumbai.chainstacklabs.com");
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, provider);

    const availableItems = await marketContract.getAvailableMarketItems();

    const items = await Promise.all(availableItems.map(async (i) => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const metadata = await axios.get(tokenUri);
      console.log("tokenUri", tokenUri);
      console.log(metadata.data);
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

    console.log(`Loaded ${items.length} items: ${JSON.stringify(items)}`);

    setNfts(items);
    setLoadingState('loaded');
  }

  async function buyNft(nft){
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await marketContract.createMarketSale(nftAddress, nft.tokenId, { value: price });

    await transaction.wait();

    loadNFTs();
  }
  
  if (loadingState === "loaded" && !nfts.length) {
    return (
      <h1 className="text-center">No NFTs available</h1>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => {
              console.log(JSON.stringify(nft));
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
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} Matic</p>
                  <button className="w-full bg-red-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Purchase item</button>
                </div>
              </div>
            )})
          }
        </div>
      </div>
    </div>
  )
}
