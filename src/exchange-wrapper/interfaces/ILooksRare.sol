// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../librairies/LibLooksRare.sol";

interface ILooksRare {
    /**
     * @notice This function allows a user to execute a taker bid (against a maker ask).
     * @param takerBid Taker bid struct
     * @param makerAsk Maker ask struct
     * @param makerSignature Maker signature
     * @param merkleTree Merkle tree struct (if the signature contains multiple maker orders)
     * @param affiliate Affiliate address
     */
    function executeTakerBid(
        LibLooksRare.Taker calldata takerBid,
        LibLooksRare.Maker calldata makerAsk,
        bytes calldata makerSignature,
        LibLooksRare.MerkleTree calldata merkleTree,
        address affiliate
    ) external payable;
}
