pragma solidity ^0.8.4;
// import "hardhat/console.sol";

// TODO: allow same token id for different NFT contracts
// TODO: test functions with invalid/non-existent token id

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    Counters.Counter private _auctionIds;
    Counters.Counter private _auctionClaimedCount;

    address payable owner; // the owner of the market will receive a commision for each item sale
    uint256 listingPrice = 0.025 ether; // in polygon network it will mean 0.025 matic

    constructor() {
        owner = payable(msg.sender);
    }

    struct Auction {
        uint256 auctionId;
        address nftContract;
        address seller;
        uint256 startingPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 auctionEnd;
        uint256 itemId;
        bool claimed;
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
    mapping(uint256 => Auction) private tokenidToAuction;
    mapping(uint256 => uint256) private auctionIdToTokenId;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool isSold
    );

    event AuctionCreated (
        address nftContract,
        uint indexed itemId,
        address seller,
        uint256 startingPrice,
        uint256 highestBid,
        address highestBidder,
        uint256 auctionEnd
    );

    event newHighBid (
        uint indexed itemId,
        uint256 highestBid,
        address highestBidder
    );

    event auctionItemClaimed (
        uint indexed itemId,
        address seller,
        address owner
    );
    

    function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 auctionEnd) public payable nonReentrant {
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(auctionEnd > 0, "auctionEnd must be greater than 0");
        require(auctionEnd > block.timestamp, "auctionEnd must be in the future");

        _auctionIds.increment();
        uint256 auctionId = _auctionIds.current();

        tokenidToAuction[tokenId] = Auction(
            auctionId,
            nftContract,
            msg.sender,
            startingPrice,
            0,
            payable(msg.sender),
            auctionEnd,
            tokenId,
            false
        );

        auctionIdToTokenId[auctionId] = tokenId;

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(
            nftContract,
            tokenId,
            msg.sender,
            startingPrice,
            0,
            msg.sender,
            auctionEnd
        );
        
    }

    // TODO: add functionality to tip the marketplace owner
    function placeBid(uint256 tokenId, uint256 bid) public payable nonReentrant {
        require(bid > 0, "Bid must be greater than 0");
        require(msg.value >= bid, "you should transfer at least the bid amount");
        require(msg.value > tokenidToAuction[tokenId].highestBid, "you should transfer a value higher than the current highest bid");
        require(tokenidToAuction[tokenId].auctionEnd > block.timestamp, "Auction has ended");
        // require(tokenidToAuction[tokenId].highestBidder != msg.sender, "You have already placed a bid");

        if (tokenidToAuction[tokenId].highestBid < bid) {
            // here we need to refund the previous bidder
            if (tokenidToAuction[tokenId].highestBid > 0) {
                // refund the ethereum funds to the previous bidder
                bool sent = tokenidToAuction[tokenId].highestBidder.send(tokenidToAuction[tokenId].highestBid);
                    //.call{value: msg.value}("");
                require(sent, "Failed to send Ether");
            }
            tokenidToAuction[tokenId].highestBid = bid;
            tokenidToAuction[tokenId].highestBidder = payable(msg.sender);
            emit newHighBid(tokenId, bid, msg.sender);
        } else {
            require(false, "Bid must be greater than the current highest bid");
        }
    }

    function claimAuctionItem(uint256 tokenId) public payable nonReentrant {
        require(tokenidToAuction[tokenId].auctionEnd < block.timestamp, "Auction has not ended");
        require(tokenidToAuction[tokenId].highestBidder == msg.sender, "You must be the highest bidder to claim the item");

        Auction memory auction = tokenidToAuction[tokenId];
        tokenidToAuction[tokenId].claimed = true;
        _auctionClaimedCount.increment();

        IERC721(auction.nftContract).transferFrom(address(this), msg.sender, tokenId);

        emit auctionItemClaimed(tokenId, auction.seller, msg.sender);
    }

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function listCurrentAuctions() public view returns (Auction[] memory) {
        uint auctionsCount = _auctionIds.current();
        uint nonClaimedAuctionsCount = auctionsCount - _auctionClaimedCount.current();
        Auction[] memory auctions = new Auction[](nonClaimedAuctionsCount);
        uint currentIndex = 0;
        for (uint256 i = 0; i < auctionsCount; i++) {
            if (tokenidToAuction[i].claimed == false) {
                auctions[currentIndex] = tokenidToAuction[i];
                currentIndex++;
            }
        }

        return auctions;
    }

    function listClaimedAuctions() public view returns (Auction[] memory) {
        uint auctionsCount = _auctionIds.current();
        uint claimedAuctionsCount = _auctionClaimedCount.current();
        Auction[] memory auctions = new Auction[](claimedAuctionsCount);
        uint currentIndex = 0;
        for (uint256 i = 0; i < auctionsCount; i++) {
            if (tokenidToAuction[i].claimed == true) {
                auctions[currentIndex] = tokenidToAuction[i];
                currentIndex++;
            }
        }

        return auctions;
    }

    function getAuctionItem(uint256 itemId) public view returns (Auction memory) {
        return tokenidToAuction[itemId];
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
        payable(owner).transfer(listingPrice);
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

    function getOngoingAuctions() public view returns (Auction[] memory) {
        uint auctionsCount = _auctionIds.current();
        uint nonClaimedAuctionsCount = auctionsCount - _auctionClaimedCount.current();
        Auction[] memory auctions = new Auction[](nonClaimedAuctionsCount);
        uint currentIndex = 0;
        for (uint256 i = 1; i <= auctionsCount; i++) {
            uint256 tokenId = auctionIdToTokenId[i];
            if (tokenidToAuction[tokenId].claimed == false && tokenidToAuction[tokenId].auctionEnd > block.timestamp) {
                Auction storage currentAuction = tokenidToAuction[tokenId];
                auctions[currentIndex] = currentAuction;
                currentIndex++;
            }
        }

        return auctions;
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
                uint currentId = i + 1;
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

    function getMyAuctions() public view returns (Auction[] memory) {
        uint totalAuctionCount = _auctionIds.current();
        uint usersAuctionCount = 0;
        uint currentIndex = 0;

        for (uint i = 1; i <= totalAuctionCount; i++) {
            uint tokenId = auctionIdToTokenId[i];
            if (tokenidToAuction[tokenId].seller == msg.sender) {
                usersAuctionCount++;
            }
        }

        Auction[] memory myAuctions = new Auction[](usersAuctionCount);
        for (uint i = 1; i <= totalAuctionCount; i++) {
            uint tokenId = auctionIdToTokenId[i];
            if (tokenidToAuction[tokenId].seller == msg.sender) {
                myAuctions[currentIndex] = tokenidToAuction[tokenId];
                currentIndex++;
            }
        }

        return myAuctions;
    }
}