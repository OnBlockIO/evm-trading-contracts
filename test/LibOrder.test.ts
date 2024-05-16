import {expect} from '../test/utils/chai-setup';
import {LibOrderTest} from '../typechain';
import {ethers} from 'hardhat';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {Asset, Order} from './utils/order';
import {ZERO, ORDER_DATA_V1, ORDER_DATA_V2} from './utils/assets';

describe('LibOrder Test', async function () {
  let wallet1: SignerWithAddress;
  let lib: LibOrderTest;

  before(async function () {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    const LibOrderTest = await ethers.getContractFactory('LibOrderTest');
    lib = await LibOrderTest.deploy();
  });

  describe('calculateRemaining', () => {
    it('should calculate remaining amounts if fill=0', async () => {
      const make = Asset('0x00000000', '0x', '100');
      const take = Asset('0x00000000', '0x', '200');
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, '1', 0, 0, '0xffffffff', '0x'),
        0,
        false
      );
      expect(result[0]).to.equal(BigInt(100));
      expect(result[1]).to.equal(BigInt(200));
    });

    it('should calculate remaining amounts if fill is specified', async () => {
      const make = Asset('0x00000000', '0x', '100');
      const take = Asset('0x00000000', '0x', '200');
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, '1', 0, 0, '0xffffffff', '0x'),
        20,
        false
      );
      expect(result[0]).to.equal(BigInt(90));
      expect(result[1]).to.equal(BigInt(180));
    });

    it('should return 0s if filled fully', async () => {
      const make = Asset('0x00000000', '0x', '100');
      const take = Asset('0x00000000', '0x', '200');
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, '1', 0, 0, '0xffffffff', '0x'),
        200,
        false
      );
      expect(result[0]).to.equal(BigInt(0));
      expect(result[1]).to.equal(BigInt(0));
    });

    it('should throw if fill is more than in the order', async () => {
      const make = Asset('0x00000000', '0x', '100');
      const take = Asset('0x00000000', '0x', '200');
      await expect(
        lib.calculateRemaining(Order(ZERO, make, ZERO, take, '1', 0, 0, '0xffffffff', '0x'), 220, false)
      ).to.be.revertedWith('panic code 0x11');
    });

    it('should throw if fill is more than in the order', async () => {
      const make = Asset('0x00000000', '0x', '100');
      const take = Asset('0x00000000', '0x', '200');
      await expect(
        lib.calculateRemaining(Order(ZERO, make, ZERO, take, '1', 0, 0, '0xffffffff', '0x'), 220, false)
      ).to.be.revertedWith('panic code 0x11');
    });

    it('should return correct reaming value for makeFill = true', async () => {
      const make = Asset('0x00000000', '0x', '200');
      const take = Asset('0x00000000', '0x', '600');
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, '1', 0, 0, ORDER_DATA_V2, '0x'),
        100,
        true
      );
      expect(result.makeAmount).to.equal(BigInt(100));
      expect(result.takeAmount).to.equal(BigInt(300));
    });

    it('should return correct reaming value for makeFill = false', async () => {
      const make = Asset('0x00000000', '0x', '100');
      const take = Asset('0x00000000', '0x', '200');
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, '1', 0, 0, ORDER_DATA_V2, '0x'),
        20,
        false
      );
      expect(result.makeAmount).to.equal(BigInt(90));
      expect(result.takeAmount).to.equal(BigInt(180));
    });
  });

  describe('validate', () => {
    const testAsset = Asset('0x00000000', '0x', '100');

    it('should not throw if dates not set', async () => {
      await lib.validate(Order(ZERO, testAsset, ZERO, testAsset, '0', 0, 0, '0xffffffff', '0x'));
    });

    it('should not throw if dates are correct', async () => {
      const block = await ethers.provider.getBlock('latest');
      const now = block!.timestamp;
      await lib.validate(Order(ZERO, testAsset, ZERO, testAsset, '0', now - 100, now + 100, '0xffffffff', '0x'));
    });

    it('should throw if start date error', async () => {
      const block = await ethers.provider.getBlock('latest');
      const now = block!.timestamp;
      await expect(
        lib.validate(Order(ZERO, testAsset, ZERO, testAsset, '0', now + 100, 0, '0xffffffff', '0x'))
      ).to.be.revertedWith('Order start validation failed');
    });

    it('should throw if end date error', async () => {
      const block = await ethers.provider.getBlock('latest');
      const now = block!.timestamp;
      await expect(
        lib.validate(Order(ZERO, testAsset, ZERO, testAsset, '0', 0, now - 100, '0xffffffff', '0x'))
      ).to.be.revertedWith('Order end validation failed');
    });

    it('should throw if both dates error', async () => {
      const block = await ethers.provider.getBlock('latest');
      const now = block!.timestamp;
      await expect(
        lib.validate(Order(ZERO, testAsset, ZERO, testAsset, '0', now + 100, now - 100, '0xffffffff', '0x'))
      ).to.be.revertedWith('Order start validation failed');
    });
  });

  describe('hashKey', () => {
    const makeAsset = Asset('0x00000000', '0x', '100');
    const takeAsset = Asset('0x00000000', '0x', '100');
    const salt = '1';
    const data = '0x12';

    it('should calculate correct hash key for no type order', async () => {
      const test_order = Order(await wallet1.getAddress(), makeAsset, ZERO, takeAsset, salt, 0, 0, '0xffffffff', data);

      const hash = await lib.hashKey(test_order);
      const test_hash = await lib.hashV1(await wallet1.getAddress(), makeAsset, takeAsset, salt);
      const test_wrong_hash = await lib.hashV2(await wallet1.getAddress(), makeAsset, takeAsset, salt, data);

      expect(hash).to.not.equal(test_wrong_hash);
      expect(hash).to.equal(test_hash);
    });

    it('should calculate correct hash key for V1 order', async () => {
      const test_order = Order(await wallet1.getAddress(), makeAsset, ZERO, takeAsset, salt, 0, 0, ORDER_DATA_V1, data);

      const hash = await lib.hashKey(test_order);
      const test_hash = await lib.hashV1(await wallet1.getAddress(), makeAsset, takeAsset, salt);
      const test_wrong_hash = await lib.hashV2(await wallet1.getAddress(), makeAsset, takeAsset, salt, data);

      expect(hash).to.not.equal(test_wrong_hash);
      expect(hash).to.equal(test_hash);
    });

    it('should calculate correct hash key for V2 order', async () => {
      const test_order = Order(await wallet1.getAddress(), makeAsset, ZERO, takeAsset, salt, 0, 0, ORDER_DATA_V2, data);

      const hash = await lib.hashKey(test_order);
      const test_hash = await lib.hashV2(await wallet1.getAddress(), makeAsset, takeAsset, salt, data);
      const test_wrong_hash = await lib.hashV1(await wallet1.getAddress(), makeAsset, takeAsset, salt);

      expect(hash).to.not.equal(test_wrong_hash);
      expect(hash).to.equal(test_hash);
    });
  });
});
