pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner; // the owner of the market will receive a commision for each item sale
    uint256 listingPrice = 0.025 ether; // in polygon network it will mean 0.025 matic

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool isSold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool isSold
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public payable nonReentrant {
        require(price > 0, "Price must be greater than zero");
        require(msg.value >= listingPrice, "You must pay at least the listing price");
        
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(itemId, nftContract, tokenId, payable(msg.sender), payable(address(0)), price, false);

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(itemId, nftContract, tokenId, msg.sender, address(0), price, false);
    }

    function createMarketSale(address nftContract, uint256 itemId) public payable nonReentrant {
        uint itemPrice = idToMarketItem[itemId].price;
        require(msg.value >= itemPrice, "You must pay at least the listing price");

        uint tokenId = idToMarketItem[itemId].tokenId;

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

        idToMarketItem[itemId].isSold = true;
        idToMarketItem[itemId].owner = payable(msg.sender);
        _itemsSold.increment();
        payable(owner).transfer(msg.value);
    }

    function getAvailableMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint availableItemsCount = itemCount - _itemsSold.current();
        MarketItem[] memory items = new MarketItem[](availableItemsCount);
        uint currentIndex = 0;
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i +1].isSold == false) {
                uint currentId = idToMarketItem[i +1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return items;
    }

    function getOwnedNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint ownedItemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i +1].owner == msg.sender) {
                ownedItemCount++;
            }
        }

        MarketItem[] memory ownedItems = new MarketItem[](ownedItemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i +1].owner == msg.sender) {
                uint currentId = idToMarketItem[i +1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                ownedItems[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return ownedItems;
    }

    function getMyNFTForSale() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint ownedItemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i +1].seller == msg.sender) {
                ownedItemCount++;
            }
        }

        MarketItem[] memory ownedItems = new MarketItem[](ownedItemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i +1].seller == msg.sender) {
                uint currentId = idToMarketItem[i +1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                ownedItems[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return ownedItems;
    }
}