import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { nftAddress, nftMarketAddress } from '../config';
import styles from '../styles/Home.module.css'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function ListMyAssets() {
    const [nfts, setNfts] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [soldNfts, setSoldNfts] = useState([]);
    const [loadingState, setLoadingState] = useState('not-loaded');
    useEffect(() => {
        load();
    }, []);

    async function load() {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);

        const auctionsPromise = loadAuctions(marketContract, tokenContract, signer);
        const nftsPromise = loadNFTs(marketContract, tokenContract, signer);
        await Promise.all([auctionsPromise, nftsPromise]);

        setLoadingState('loaded');
    }

    async function loadAuctions(marketContract, tokenContract, signer) {
        // const web3modal = new Web3Modal();
        // const connection = await web3modal.connect();
        // const provider = new ethers.providers.Web3Provider(connection);
        // const signer = provider.getSigner();

        // const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        // const tokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);
        const data = await marketContract.getMyAuctions();
        console.log(`data is ${JSON.stringify(data)}`);

        const items = await Promise.all(data.map(async (i) => {
            const tokenUri = await tokenContract.tokenURI(i.itemId);
            const metadata = await axios.get(tokenUri);
            let startingPrice = ethers.utils.formatUnits(i.startingPrice.toString(), "ether");
            let highestBid = ethers.utils.formatUnits(i.highestBid.toString(), "ether");

            return {
                id: i.itemId,
                image: metadata && metadata.data && metadata.data.image,
                name: metadata && metadata.data && metadata.data.name,
                startingPrice,
                highestBid,
                auctionId: i.auctionId,
                auctionEnd: i.auctionEnd,
                claimed: i.claimed
            };
        }));

        const nonClaimedItems = items.filter(i => !i.claimed);
        setAuctions(nonClaimedItems);
        console.log(`Loaded ${nonClaimedItems.length} auctions`);
        console.log(`nonClaimedItems: ${JSON.stringify(nonClaimedItems)}`);

        if (loadingState === "loaded" && !nfts.length) {
            return (
                <h1 className="text-center">You have not ongoing auctions</h1>
            )
        }
    }

    async function loadNFTs(marketContract, tokenContract, signer) {
        // const web3modal = new Web3Modal();
        // const connection = await web3modal.connect();
        // const provider = new ethers.providers.Web3Provider(connection);
        // const signer = provider.getSigner();

        // const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        // const tokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);
        const data = await marketContract.getMyNFTForSale();

        const items = await Promise.all(data.map(async (i) => {
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
                isSold: i.isSold// && i.owner !- i.seller
            }

            return item;
        }));
        
        const soldItems = items.filter(i => i.isSold);
        setNfts(items);
        setSoldNfts(soldItems);

        if (loadingState === "loaded" && !nfts.length) {
            return (
                <h1 className="text-center">You have not NFTs for sale</h1>
            )
        }
    }

    return (
        <div className="flex justify-center">
            <div className="p-4">
                <div className="grid grid-cols-1 sm: grid-cols-2 md: grid-cols-3 lg: grid-cols-4 gap-4">
                    {nfts.map((nft, i) => (
                            <div key={i} className="bg-grey rounded shadow-md p-4">
                                <img src={nft.image} className="rounded" />
                                <div className="p-4 bg-black">
                                    <p className="text-2xl text-white">Price {nft.price} Matic</p>
                                </div>
                            </div>)
                    )}
                    {auctions.map((auction, i) => {
                        let auctionEndDate = ethers.BigNumber.from(auction.auctionEnd).toNumber();
                        console.log("auctionEndDate", auctionEndDate);
                        auctionEndDate = new Date(auctionEndDate * 1000);
                        console.log("auctionEndDate", auctionEndDate);
                        auctionEndDate = auctionEndDate.getTime();
                        console.log("auctionEndDate", auctionEndDate);
                        auctionEndDate = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(auctionEndDate);
                        return (
                            <div key={i} className="bg-grey rounded shadow-md p-4">
                                <img src={auction.image} className="rounded" />
                                <div className="p-4 bg-black">
                                    <p className="text text-white">Starting Price: {auction.startingPrice} Matic</p>
                                    <p className="text text-white">Highest Bid: {auction.highestBid} Matic</p>
                                </div>
                                <div className="p-4 bg-red-500">
                                    {/* here we will show the auction end date as date format */}
                                    <p className="text text-white">Auction Ends: {auctionEndDate}</p>
                                    {/* new line as separation */}
                                    <div className="border-b-2 border-black-500"></div>
                                    <p className="text text-white">Highest Bid: {auction.highestBid} Matic</p>
                                </div>
                            </div>)}
                    )}
                    {
                        Boolean(soldNfts.length) && (
                            <div>
                                <h2 className="text-2xl py-2">Sold NFTs</h2>
                                <div className="grid grid-cols-1 sm: grid-cols-2 md: grid-cols-3 lg: grid-cols-4 gap-4">
                                    {
                                        soldNfts.map((nft, i) => (
                                            <div key={i} className="bg-grey rounded shadow-md p-4">
                                                <img src={nft.image} className="rounded" />
                                                <div className="p-4 bg-black">
                                                {/* here we will show the nft item id in a small size font */}
                                                    <p className="small text-white">TokenId: {nft.tokenId}</p>
                                                    <p className="text-1xl text-white">Price {nft.price} Matic</p>
                                                </div>
                                            </div>)
                                        )
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )

}