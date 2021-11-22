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
  console.log(`Config: ${JSON.stringify(config)}`);
  const network = config.network;
  const nftAddress = config.deployments[network].nftContract;
  const nftMarketAddress = config.deployments[network].nftMarketplace;
  const currency = config.currency[network] || "MATIC";
  const assetPricePlaceholder = `Asset Price in ${currency}`;
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({ price: "", name: "", description: "" });
  const router = useRouter();

  const ipfsClient = ipfsHttpClient(config.ipfsApiUrl);

  async function onChange(event) {
    const file = event.target.files[0];
    try {
      const added = await ipfsClient.add(file, {
        progress: (prog) => console.log(`received: ${prog}`)
      });
      const url = `${config.ipfsPublicUrl}/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  }

  async function createItem() {
    const { price, name, description } = formInput;
    if (!price || !name || !description || !fileUrl) return;
    const data = JSON.stringify({ name, description, price, image: fileUrl });
    try {
      const added = await ipfsClient.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      createSale(url);
    } catch (error) {
      console.log(`Error uploading file: ${error}`);
    }
  }

  async function createSale(url) {
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

    const price = ethers.utils.parseEther(formInput.price, "ether");

    contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    transaction = await contract.createMarketItem(nftAddress, tokenId, price, { value: listingPrice });

    await transaction.wait();
    router.push("/");
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
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
          placeholder={assetPricePlaceholder}
          className="mt-2 border rounded p-4"
          onChange={e => setFormInput({ ...formInput, price: e.target.value })}
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
          Create NFT
        </button>
      </div>
    </div>
  )
}