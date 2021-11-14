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
    const [loadingState, setLoadingState] = useState('not-loaded');
    useEffect(() => {
        loadNFTs();
    }, []);

    async function loadNFTs() {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);
        const data = await marketContract.getOwnedNFTs();

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
            }

            return item;
        }));

        setNfts(items);
        setLoadingState('loaded');

        console.log("loadingState is: ", loadingState);
        console.log("nfts.length is: ", nfts.length);

        if (loadingState != "loaded" && !nfts.length) {
            return (
                <h1 className="text-center text-black">You don't have NFTs yet!</h1>
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
                        </div>))}
                </div>
            </div>
        </div>
    )
}