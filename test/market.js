const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Market", function () {
  let usdt, market, myNft, account1, account2;
  let baseURI = "https://sameple.com/";

  beforeEach(async () => {
    [account1, account2] = await ethers.getSigners();
    // const MAX_ALLOWANCE = BigNumber.from(2).pow(256).sub(1);
    const USDT = await ethers.getContractFactory("cUSDT");
    usdt = await USDT.deploy();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNft = await MyNFT.deploy();
    const Market = await ethers.getContractFactory("Market");
    market = await Market.deploy(usdt.target, myNft.target);
    // console.log(account1)

    await myNft.safeMint(account1.address, baseURI + "0");
    await myNft.safeMint(account1.address, baseURI + "1");

    await myNft.approve(market.target, 0);
    await myNft.approve(market.target, 1);
    await usdt.transfer(account2.address, "10000000000000000000000");

    await usdt
      .connect(account2)
      .approve(market.target, "1000000000000000000000000");
  });

  it("its erc20 address should be usdt", async function () {
    expect(await market.erc20()).to.equal(usdt.target);
  });

  it("its erc721 address should be myNft", async function () {
    expect(await market.erc721()).to.equal(myNft.target);
  });

  it("account1 should have 2 nfts", async function () {
    expect(await myNft.balanceOf(account1.address)).to.equal(2);
  });

  it("account2 should have 10000 USDT", async function () {
    expect(await usdt.balanceOf(account2.address)).to.equal(
      "10000000000000000000000"
    );
  });

  it("account2 should have 0 nfts", async function () {
    expect(await myNft.balanceOf(account2.address)).to.equal(0);
  });

  it("account1 can list two nfts to market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    // let price = "0x0100"
    await expect(await market.connect(account1).addOrder(0, price))
      .to.emit(market, "AddOrder")
      .withArgs(account1.address, 0, price);
    const [value1, velue2] = await market.getOrder(0);
    expect(value1).to.be.equal(account1.address);
    expect(velue2).to.be.equal(price);
    // expect(await market.getOrder(0)).to.be.equal([account1.address, price]);
  });

  it("account1 can unlist one nft from market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    await market.connect(account1).addOrder(0, price);
    await expect(await market.connect(account1).removeOrder(0))
      .to.emit(market, "RemoveOrder")
      .withArgs(account1.address, 0);
    const [value1, velue2] = await market.getOrder(0);
    expect(value1).to.be.equal("0x0000000000000000000000000000000000000000");
    expect(velue2).to.be.equal(0);
  });

  it("account1 can change price of nft from market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    await market.connect(account1).addOrder(0, price);
    const newPrice =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634500";
    await expect(await market.connect(account1).changePrice(0, newPrice))
      .to.emit(market, "ChangePrice")
      .withArgs(account1.address, 0, price, newPrice);

    const [value1, velue2] = await market.getOrder(0);
    expect(value1).to.be.equal(account1.address);
    expect(velue2).to.be.equal(newPrice);
  });

  it("account2 can buy nft from market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    await market.connect(account1).addOrder(0, price);
    await expect(await market.connect(account2).buy(0))
      .to.emit(market, "Deal")
      .withArgs(account1.address, account2.address, 0, price);
  });
});
