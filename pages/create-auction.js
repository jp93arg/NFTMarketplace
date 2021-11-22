import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

import loadConfig from "./loadConfig";

export async function getStaticProps() {
  const config = await loadConfig();
  return {props: config};
}

export default function CreateItems(config) {
  const network = config.network;
  const nftAddress = config.deployments[network].nftContract;
  const nftMarketAddress = config.deployments[network].nftMarketplace;
  const currency = config.currency[network] || "MATIC";

  const ipfsClient = ipfsHttpClient(config.ipfsApiUrl);

  const startingPricePlaceholder = `Starting price in ${currency}`;
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({ startingPrice: "", name: "", description: "", auctionEndDate: "" });
  const router = useRouter();

  async function onChange(event) {
    const file = event.target.files[0];
    try {
      const added = await ipfsClient.add(file, {
        progress: (prog) => console.log(`received: ${prog}`)
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  }

  async function createItem() {
    const { startingPrice, name, description, auctionEndDate } = formInput;
    if (!startingPrice || !name || !description || !fileUrl || !auctionEndDate) {
      alert("Please fill in all fields");
      return;
    }
    let timestampAuctionDate = new Date(auctionEndDate).getTime();
    timestampAuctionDate = (Math.floor(timestampAuctionDate) / 1000);
    if (timestampAuctionDate < Math.floor(Date.now() / 1000)) {
      alert("Auction end date must be in the future");
      return;
    }
    const data = JSON.stringify({ name, description, image: fileUrl });
    try {
      const added = await ipfsClient.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      createAuction(url);
    } catch (error) {
      console.log(`Error uploading file: ${error}`);
    }
  }

  async function createAuction(url) {
    const { auctionEndDate } = formInput;
    let timestampAuctionDate = new Date(auctionEndDate).getTime();
    timestampAuctionDate = (Math.floor(timestampAuctionDate) / 1000);

    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
    let transaction = await contract.createToken(url);
    let tx = await transaction.wait();
    console.log(`Transaction: ${JSON.stringify(tx)}`);

    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();

    const auctionStartingPrice = ethers.utils.parseEther(formInput.startingPrice, "ether");

    contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);

    transaction = await contract.createAuction(nftAddress, tokenId, auctionStartingPrice, timestampAuctionDate);

    await transaction.wait();
    router.push("/");
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <label className="mt-2">NFT details</label>
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => setFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => setFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder={startingPricePlaceholder} 
          className="mt-2 border rounded p-4"
          onChange={e => setFormInput({ ...formInput, startingPrice: e.target.value })}
        />
        <label className="mt-2">Auction end date</label>
        <input
          placeholder="Auction end date"
          type="datetime-local"
          className="mt-2 border rounded p-4"
          onChange={e => setFormInput({ ...formInput, auctionEndDate: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <img src={fileUrl} className="w-full h-64" />
          )
        }
        <button onClick={createItem} className="font-bold mt-4 bg-red-500 text-black rounded p-2 shadow-lg">
          Create NFT and place on auction
        </button>
      </div>
    </div>
  )
}