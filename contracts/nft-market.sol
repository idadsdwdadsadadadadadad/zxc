// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
contract Market is IERC721Receiver{
    IERC20 public erc20;
    IERC721 public erc721;

    struct Order {
        address seller;
        uint256 tokenId;
        uint256 price;
    }
    mapping(uint256 => Order) public orders;
    Order[] public orderList;
    mapping(uint256 => uint256) public orderIndex; // token id index

    event AddOrder(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price
    );
    event Deal(address seller, address buyer, uint256 tokenId, uint256 price);
    event ChangePrice(
        address seller,
        uint256 tokenId,
        uint256 perPerice,
        uint256 price
    );
    event RemoveOrder(address seller, uint256 tokenId);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address _erc20, address _erc721) {
        require(_erc20 != address(0), "zero address erc20");
        require(_erc721 != address(0), "zero address erc721");
        erc20 = IERC20(_erc20);
        erc721 = IERC721(_erc721);
    }

    function buy(uint _tokenId) external payable {
        address seller = orders[_tokenId].seller;
        uint256 price = orders[_tokenId].price;
        require(
            erc20.transferFrom(msg.sender, seller, price),
            "transfer failed"
        );
        erc721.transferFrom(address(this), msg.sender, _tokenId);

        //  remove order
        _removeOrder(_tokenId);
        emit Deal(seller, msg.sender, _tokenId, price);
    }

    function removeOrder(uint256 tokenId) external {
        address seller = orders[tokenId].seller;
        require(seller == msg.sender, "not the seller");
        erc721.transferFrom(address(this), seller, tokenId);
        _removeOrder(tokenId);
        emit RemoveOrder(seller, tokenId);
    }

    function addOrder(uint256 _tokenId, uint256 _price) external {
        require(erc721.getApproved(_tokenId) == address(this), "not approved");
        erc721.transferFrom(msg.sender, address(this), _tokenId);
        _addOrder(msg.sender, _tokenId, _price);
        emit AddOrder(msg.sender, _tokenId, _price);
    }

    function changePrice(uint256 tokenId, uint256 price) external {
        uint256 perPrice = orders[tokenId].price;
        address seller = orders[tokenId].seller;
        require(seller == msg.sender, "not the seller");
        orders[tokenId].price = price;
        emit ChangePrice(seller, tokenId, perPrice, price);
    }

    function _removeOrder(uint256 _tokenId) internal {
        delete orders[_tokenId];
    }

    function _addOrder(
        address _seller,
        uint256 _tokenId,
        uint256 _price
    ) internal {
        orders[_tokenId] = Order(_seller, _tokenId, _price);
    }

    function getOrder(
        uint256 _tokenId
    ) external view returns (address, uint256) {
        return (orders[_tokenId].seller, orders[_tokenId].price);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        return bytes4(0x12345678);
    }
}
