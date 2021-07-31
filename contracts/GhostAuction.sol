/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;
pragma abicoder v2;

/// OpenZeppelin library for performing math operations without overflows.
import {SafeMathUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
/// OpenZeppelin security library for preventing reentrancy attacks.
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
/// For checking `supportsInterface`.
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./lib/LibTransfer.sol";


contract GhostAuction is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    /// Use OpenZeppelin's SafeMath library to prevent overflows.
    using SafeMathUpgradeable for uint256;

    using CountersUpgradeable for CountersUpgradeable.Counter;

    using LibTransfer for address;

    /// _tokenIdTracker to generate automated token IDs
    CountersUpgradeable.Counter private _auctionId;

    /// ============ Constants ============

    /// The % of ETH needed above the current bid for a new bid to be valid; 5%.
    uint8 public minBidIncrementPercentAuction;
    /// The min and max duration allowed for auctions; 10 minutes - 30 days.
    uint256 public minAuctionDuration;
    uint256 public maxAuctionDuration;
    /// Interface constant for ERC721, to check values in constructor.
    bytes4 private constant ERC721_INTERFACE_ID = 0x80ac58cd;
    /// Interface constant for ERC1155, to check values in constructor.
    bytes4 private constant ERC1155_INTERFACE_ID = 0xd9b67a26;

    /// ============ Immutable Storage ============

    /// The address that initially is able to recover assets.
    address internal adminRecoveryAddress;

    /// ============ Mutable Storage ============

    /**
     * @dev The account `adminRecoveryAddress` can also pause the contracts.
     * This prevents people from using the contract if there is a known problem with it.
     */
    bool private _paused;

    /// A mapping of all of the auctions currently running.
    mapping(uint256 => Auction) public auctions;

    enum AuctionTypes {
        Other,
        Classic,
        Reserve,
        Dutch
    }

    /// ============ Structs ============

    struct Auction {
        /// The value of the current highest bid.
        uint256 amount;
        /// The amount of time that the auction should run for,
        /// after the first bid was made.
        uint256 duration;
        /// The time of the first bid.
        uint256 firstBidTime;
        /// The minimum price of the first bid.
        uint256 reservePrice;
        /// The address of the current highest bid.
        address payable bidder;
        /// The address that created the auction.
        address creator;
        /// Address of the NFT contract
        address nftContract;
        /// TokenId of the NFT contract
        uint256 tokenId;
        /// Type of the auction
        AuctionTypes auctionType;
        /// starting block.timestamp of the auction
        uint256 startingAt;
        /// starting price of the auction
        uint256 startingPrice;
        /// ending price of the auction
        uint256 endingPrice;
        /// extension period of the auction
        uint256 extensionPeriod;
    }
    struct AuctionResult {
        uint256 auctionId;
        address winner;
        uint256 amount;
        address creator;
    }

    /// ============ Events ============

    /// All of the details of a new auction,
    event OrderCreated(
        uint256 auctionId,
        uint256 tokenId,
        address nftContractAddress,
        uint256 duration,
        uint256 reservePrice,
        uint256 endPrice,
        AuctionTypes auctionType,
        uint256 startingAt,
        uint256 extensionPeriod
    );

    /// All of the details of a new bid,
    event OrderBid(
        uint256 auctionId,
        address nftContractAddress,
        uint256 tokenId,
        address sender,
        uint256 value
    );

    /// All of the details of an auction's cancelation,
    event OrderCancelled(
        uint256 auctionId,
        address nftContractAddress,
        uint256 tokenId
    );

    /// Emitted in the case that the contract is paused.
    event Paused(address account);
    /// Emitted when the contract is unpaused.
    event Unpaused(address account);

    /// ============ Modifiers ============

    modifier onlyAdminRecovery() {
        require(
            /// The sender must be the admin address, and
            adminRecoveryAddress == msg.sender,
            "CDNHAP"
        );
        _;
    }

    /// Reverts if the contract is paused.
    modifier whenNotPaused() {
        require(!paused(), "CIP");
        _;
    }

    /// Reverts if the auction does not exist.
    modifier auctionExists(uint256 auctionId) {
        /// The auction exists if the nftContractAddress is not null.
        require(!auctionNftContractIsNull(auctionId), "ADE");
        _;
    }

    /// Reverts if the auction exists.
    modifier auctionNonExistant(uint256 auctionId) {
        /// The auction does not exist if the nftContractAddress is null.
        require(auctionNftContractIsNull(auctionId), "AAE");
        _;
    }

    /// Reverts if the auction is expired.
    modifier auctionNotExpired(uint256 auctionId) {
        require(
            /// Auction is not expired if there's never been a bid, or if the
            /// current time is less than the time at which the auction ends.
            auctions[auctionId].firstBidTime == 0 ||
                block.timestamp < auctionEnds(auctionId),
            "AE"
        );
        _;
    
    }
    modifier auctionStarted(uint256 auctionId) {
         /// if auction startdate is smaller then or equals the block.timestamp it has started
        require(
            auctions[auctionId].startingAt <= block.timestamp,
            "ANS"
        );
        _;
    }

    /// Reverts if the auction is not complete.
    /// Auction is complete if there was a bid, and the time has run out.
    modifier auctionComplete(uint256 auctionId) {
        if (auctions[auctionId].auctionType == AuctionTypes.Dutch) {
            require(auctions[auctionId].firstBidTime != 0, "DAHC");
        } else {    
            /// Auction is complete if there has been a bid, and the current time
            /// is greater than the auction's end time.    
            require(auctions[auctionId].firstBidTime > 0 && block.timestamp >= auctionEnds(auctionId),
                "AHC"
            );
        }
        _;
    }

    /// ============ Constructor ============

    function __ReserveAuctionV3_init_unchained(address adminRecoveryAddress_)
        internal
        initializer
    {
        adminRecoveryAddress = adminRecoveryAddress_;
        /// Initialize mutable memory.
        _paused = false;
        __Ownable_init_unchained();
        setMinBidIncrementPercent(5);
        /// 10 minutes
        setMinAuctionDuration(60 * 10);
        /// 30 days
        setMaxAuctionDuration(60 * 60 * 24 * 30);
    }
    
    function setMinBidIncrementPercent(uint8 minBidIncrementPercentExtVar) public onlyOwner {
        minBidIncrementPercentAuction = minBidIncrementPercentExtVar;
    }

    function setMinAuctionDuration(uint256 minDurationExtVar) public onlyOwner {
        minAuctionDuration = minDurationExtVar;
    }

    function setMaxAuctionDuration(uint256 maxDurationExtVar) public onlyOwner {
        maxAuctionDuration = maxDurationExtVar;
    }

    /// ============ Create Auction ============

    function createAuction(
        uint256 tokenId,
        uint256 duration,
        uint256 reservePrice,
        address nftContractAddress,
        AuctionTypes auctionType,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 startDate,
        uint256 extensionPeriod
    ) external nonReentrant whenNotPaused {
        _auctionId.increment();
        /// Check basic input requirements are reasonable.
        require(
            IERC165Upgradeable(nftContractAddress).supportsInterface(
                ERC721_INTERFACE_ID
            ) ||
                IERC165Upgradeable(nftContractAddress).supportsInterface(
                    ERC1155_INTERFACE_ID
                ),
            "CANADNSNI"
        );
        require(
            duration >= minAuctionDuration && duration <= maxAuctionDuration,
            "DIETLOTH"
        );
        require(
            // maximum of 60 minutes for extension period
            extensionPeriod >= 0 && extensionPeriod <= 3600,
            "EPHTBLOH"
        );
        if (auctionType == AuctionTypes.Dutch) {
            require(startingPrice > 0, "ASPGZ");
            require(endingPrice > 0, "AEPGZ");
            require(startingPrice > endingPrice, "ASPGEP");
        }
        /// Initialize the auction details, including null values.
        auctions[this.getCurrentAuctionId()] = Auction({
            duration: duration,
            reservePrice: reservePrice,
            creator: msg.sender,
            nftContract: nftContractAddress,
            tokenId: tokenId,
            amount: 0,
            firstBidTime: 0,
            bidder: payable(address(0)),
            auctionType: auctionType,
            /// start date can not be in the past
            startingAt: startDate > block.timestamp ? startDate : block.timestamp,
            startingPrice: startingPrice,
            endingPrice: endingPrice,
            extensionPeriod: extensionPeriod
        });

        /// Emit an event describing the new auction.
        emit OrderCreated(
            this.getCurrentAuctionId(),
            tokenId,
            nftContractAddress,
            duration,
            reservePrice,
            endingPrice,
            auctionType,
            startDate,
            extensionPeriod
        );
    }

    /**
     * @dev get the current _auctionId (after it was incremented)
     */
    function getCurrentAuctionId() external view returns (uint256) {
        return _auctionId.current();
    }

    /// ============ Create Bid ============

    function createBid(uint256 auctionId, uint256 amount)
        external
        payable
        nonReentrant
        whenNotPaused
        auctionExists(auctionId)
        auctionNotExpired(auctionId)
        auctionStarted(auctionId)
    {
        /// Validate that the user's expected bid value matches the ETH deposit.
        require(amount == msg.value, "ADNEMV");
        require(amount > 0, "AMGT0");
        if (auctions[auctionId].auctionType == AuctionTypes.Reserve || auctions[auctionId].auctionType == AuctionTypes.Classic) {
        /// Check if the current bid amount is 0.
            if (auctions[auctionId].amount == 0) {
                /// If so, it is the first bid.
                auctions[auctionId].firstBidTime = block.timestamp;
                /// for reserve auction
                if (auctions[auctionId].auctionType == AuctionTypes.Reserve) {
                    /// We only need to check if the bid matches reserve bid for the first bid,
                    /// since future checks will need to be higher than any previous bid.
                    require(
                        amount >= auctions[auctionId].reservePrice,
                        "MBRPOM"
                    );
                }
            } else {
                /// Check that the new bid is sufficiently higher than the previous bid, by
                /// the percentage defined as minBidIncrementPercentAuction.
                require(
                    amount >=
                        auctions[auctionId].amount.add(
                            /// Add minBidIncrementPercentAuction of the current bid to the current bid.
                            auctions[auctionId]
                            .amount
                            .mul(minBidIncrementPercentAuction)
                            .div(100)
                        ),
                    "NMB"
                );

                /// Refund the previous bidder.
                address(auctions[auctionId].bidder).transferEth(auctions[auctionId].amount);
            }
        }
        if (auctions[auctionId].auctionType == AuctionTypes.Dutch) {
            /// only one bid allowed
            require(auctions[auctionId].firstBidTime == 0, "DACOHOB");
            uint256 price = getCurrentPrice(auctions[auctionId]);
            require(msg.value >= price, "MSGVGEP");
            amount = msg.value;
            auctions[auctionId].endingPrice = price;
            auctions[auctionId].firstBidTime = block.timestamp;
        }
        /// Update the current auction.
        auctions[auctionId].amount = amount;
        auctions[auctionId].bidder = payable(msg.sender);
        /// Compare the auction's end time with the current time plus the extension period,
        /// to see whether we're near the auctions end and should extend the auction.
        if (auctions[auctionId].extensionPeriod != 0 && auctions[auctionId].auctionType != AuctionTypes.Dutch) {
            if (auctionEnds(auctionId) < block.timestamp.add(auctions[auctionId].extensionPeriod)) {
                /// We add onto the duration whenever time increment is required, so
                /// that the auctionEnds at the current time plus the buffer.
                auctions[auctionId].duration += block
                .timestamp
                .add(auctions[auctionId].extensionPeriod)
                .sub(auctionEnds(auctionId));
            }
        }
        /// Emit the event that a bid has been made.
        emit OrderBid(
            auctionId,
            auctions[auctionId].nftContract,
            auctions[auctionId].tokenId,
            msg.sender,
            amount
        );
    }

    /**
     * @dev calculate the current price for the dutch auction
     * 
     * timeSinceStart = block.timestamp - auction.startingAt
     * priceDiff = auction.startingPrice - auction.endingPrice
     * currentPrice = auction.startingPrice - (timeSinceStart * (priceDiff / auction.duration))
     */
    function getCurrentPrice(Auction memory auction) public view returns (uint256) {
      require(auction.startingAt > 0);

      uint256 secondsPassed = block.timestamp - auction.startingAt;

      if (secondsPassed >= auction.duration) {
          return auction.endingPrice;
      } else {
        uint256 currentPrice = auction.startingPrice.sub((block.timestamp.sub(auction.startingAt))
            .mul((auction.startingPrice.sub(auction.endingPrice))
            .div(auction.duration))
        );
        if (currentPrice < auction.endingPrice)
        {
            currentPrice = auction.endingPrice;
        }
        return currentPrice;
      }
    }
    
    /**
     * @dev get the relevant data after the auction has ended:
     * auctionId, winner address, amount, creator address
     */
    function getEndAuctionData(uint256 auctionId)
        public
        view
        whenNotPaused
        auctionComplete(auctionId)
        returns (AuctionResult memory)
    {
        /// Store relevant auction data in memory for the life of this function.
        address winner = auctions[auctionId].bidder;
        uint256 amount = auctions[auctionId].amount;
        address creator = auctions[auctionId].creator;

        return AuctionResult(auctionId, winner, amount, creator);
    }

    /**
     * @dev Remove all auction data for this token from storage
     */
    function deleteAuction(uint256 auctionId)
        internal
        whenNotPaused
        auctionComplete(auctionId)
    {
        delete auctions[auctionId];
    }

    /**
     * @dev Admin can remove all auction data for this token from storage
     */
    function deleteAuctionOnlyAdmin(uint256 auctionId)
        public
        whenNotPaused
        onlyAdminRecovery
        auctionComplete(auctionId)
    {
        delete auctions[auctionId];
    }

    /// ============ Cancel Auction ============

    function cancelAuction(uint256 auctionId)
        external
        nonReentrant
        auctionExists(auctionId)
    {
        /// Check that there hasn't already been a bid for this NFT.
        require(
            uint256(auctions[auctionId].firstBidTime) == 0,
            "Auction already had a bid"
        );
        require(
            auctions[auctionId].creator == msg.sender,
            "Auction can only be cancelled by the address who created it"
        );
        /// Dutch auction can only be canceled if it has not yet started
        if (auctions[auctionId].auctionType == AuctionTypes.Dutch) {
            require(
                auctions[auctionId].startingAt >= block.timestamp,
                "AAS"
            );
        }
        /// Pull the creator address before removing the auction.
        address nftContract = auctions[auctionId].nftContract;
        uint256 tokenId = auctions[auctionId].tokenId;

        /// Remove all data about the auction.
        delete auctions[auctionId];

        /// Emit an event describing that the auction has been canceled.
        emit OrderCancelled(auctionId, nftContract, tokenId);
    }

    /// ============ Admin Functions ============

    function pauseContract() 
        external 
        onlyAdminRecovery 
    {
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpauseContract() 
        external 
        onlyAdminRecovery 
    {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Allows the admin to transfer any ETH from this contract to the recovery address.
     */
    function recoverBNB(uint256 amount)
        external
        onlyAdminRecovery
    {
        /// Attempt an ETH transfer to the recovery account, and return true if it succeeds.
        adminRecoveryAddress.transferEth(amount);
    }

    /// ============ Miscellaneous Public and External ============

    /**
     * @dev Returns true if the contract is paused.
     */
    function paused() 
        public 
        view 
        returns (bool) 
    {
        return _paused;
    }

    /**
     * @dev The auction should not exist if the nftContract address is the null address
     * @return true if the auction's nftContract address is set to the null address.
     */ 
    function auctionNftContractIsNull(uint256 auctionId)
        private
        view
        returns (bool)
    {
        return auctions[auctionId].nftContract == address(0);
    }

    /**
     * @dev auction endtime is derived by adding the auction's duration to the time of the first bid.
     * @notice duration can be extended conditionally after each new bid is added.
     * @return the timestamp at which an auction will finish.
     */ 
    function auctionEnds(uint256 auctionId) 
        private 
        view 
        returns (uint256) 
    {
        return auctions[auctionId].firstBidTime.add(auctions[auctionId].duration);
    }

    uint256[50] private __gap;
}
