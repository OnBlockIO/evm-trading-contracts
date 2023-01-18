// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../interfaces/IERC2981.sol";
import "../LibRoyalties2981.sol";
import "../../librairies/LibPart.sol";

contract Royalties2981TestImpl is IERC2981 {
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        receiver = address(uint160(_tokenId >> 96));
        royaltyAmount = _salePrice / 10;
    }

    function calculateRoyaltiesTest(address payable to, uint96 amount) external returns (LibPart.Part[] memory) {
        return LibRoyalties2981.calculateRoyalties(to, amount);
    }
}
