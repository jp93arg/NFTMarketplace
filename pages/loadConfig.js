module.exports = () => {
    const config = {
        network: process.env.NETWORK,
        ipfsApiUrl: process.env.IPFS_API_URL || "",
        ipfsPublicUrl: process.env.IPFS_PUBLIC_URL || "",
        currency: {
            localhost: "ETHER",
            kovan: "ETHER",
            mainnet: "MATIC",
            mumbai: "MATIC",
            rinkeby: "ETHER"
        },
        web3Providers: {
            mumbai: {
                url: process.env.MUMBAI_NODE_URL || "",
            },
            localhost: {
                url: process.env.LOCALHOST_NODE_URL || "",
            },
            rinkeby: {
                url: process.env.RINKEBY_NODE_URL || "",
            }
        },
        deployments: {
            localhost: {
                nftContract: process.env.LOCAL_NFT_ADDRESS,
                nftMarketplace: process.env.LOCAL_NFT_MARKETPLACE_ADDRESS,
            },
            mumbai: {
                nftContract: process.env.MUMBAI_NFT_ADDRESS,
                nftMarketplace: process.env.MUMBAI_NFT_MARKETPLACE_ADDRESS,
            },
            rinkeby: {
                nftContract: process.env.RINKEBY_NFT_ADDRESS,
                nftMarketplace: process.env.RINKEBY_NFT_MARKETPLACE_ADDRESS,
            }
        }
    };
    return config;
}