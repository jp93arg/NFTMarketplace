import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

import loadConfig from "./loadConfig";

export async function getStaticProps() {
    const config = await loadConfig();
    return { props: config };
}

export default function ListMyAssets(config) {
    const network = config.network;
    const nftAddress = config.deployments[network].nftContract;
    const nftMarketAddress = config.deployments[network].nftMarketplace;
    const currency = config.currency[network] || "MATIC";
    const [nfts, setNfts] = useState([]);
    const [loadingState, setLoadingState] = useState('not-loaded');
    useEffect(() => {
        loadNFTs();
    }, []);

    async function loadNFTs() {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        let address = await provider.listAccounts();
        address = String(address) || "0x0000000000000000000000000000000000000000";

        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);
        const boughtNFTs = await marketContract.getOwnedNFTs(address);
        const claimedNFTs = await marketContract.getClaimedAuctions(address);

        const boughtItems = await Promise.all(boughtNFTs.map(async (i) => {
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

        const claimedItems = await Promise.all(claimedNFTs.map(async (i) => {
            const tokenUri = await tokenContract.tokenURI(i.itemId);
            const metadata = await axios.get(tokenUri);
            let highestBid = ethers.utils.formatUnits(i.highestBid.toString(), "ether");

            return {
                itemId: i.itemId,
                image: metadata && metadata.data && metadata.data.image,
                name: metadata && metadata.data && metadata.data.name,
                price: highestBid
            };
        }));

        const items = [...boughtItems, ...claimedItems];

        setNfts(items);
        setLoadingState('loaded');
        if (loadingState != "loaded" && !nfts.length) {
            return (
                <h1 className="text-center text-black">You do not have NFTs yet!</h1>
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
                                <p className="text-2xl text-white">Price paid {nft.price} {currency}</p>
                                <p className="text-2xl text-white">Name {nft.name} {currency}</p>
                            </div>
                        </div>))}
                </div>
            </div>
        </div>
    )
}