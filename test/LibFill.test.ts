import {expect} from '../test/utils/chai-setup';
import {LibFillTest} from '../typechain';
import {ethers} from 'hardhat';
import {Asset, Order} from './utils/order';
import {ZERO} from './utils/assets';

describe('LibFill Test', async function () {
  let lib: LibFillTest;

  before(async function () {
    const LibFillTest = await ethers.getContractFactory('LibFillTest');
    lib = await LibFillTest.deploy();
  });

  describe('right order fill', () => {
    it('should fill fully right order if amounts are fully matched', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '50'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(50);
      expect(fill[1]).to.equal(100);
    });

    it('should throw if right order is fully matched, but price is not ok', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '99'),
        ZERO,
        Asset('0x00000000', '0x', '50'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      await expect(lib.fillOrder(left, right, 0, 0, false, false)).to.be.revertedWith('fillRight: unable to fill');
    });

    it('should fill right order and return profit if more than needed', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '101'),
        ZERO,
        Asset('0x00000000', '0x', '50'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(50);
      expect(fill[1]).to.equal(100);
    });
  });

  describe('left order fill', () => {
    it('should fill orders when prices match exactly', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '400'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(100);
      expect(fill[1]).to.equal(200);
    });

    it('should fill orders when right order has better price', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '1000'),
        ZERO,
        Asset('0x00000000', '0x', '2000'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '4001'),
        ZERO,
        Asset('0x00000000', '0x', '2000'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(1000);
      expect(fill[1]).to.equal(2000);
    });

    it('should throw if price is not ok', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '1000'),
        ZERO,
        Asset('0x00000000', '0x', '2000'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '3990'),
        ZERO,
        Asset('0x00000000', '0x', '2000'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      await expect(lib.fillOrder(left, right, 0, 0, false, false)).to.be.revertedWith('fillLeft: unable to fill');
    });
  });

  describe('both orders fill', () => {
    it('should fill orders when prices match exactly', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '200'),
        ZERO,
        Asset('0x00000000', '0x', '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(100);
      expect(fill[1]).to.equal(200);
    });

    it('should fill orders when right order has better price', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '300'),
        ZERO,
        Asset('0x00000000', '0x', '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(100);
      expect(fill[1]).to.equal(200);
    });

    it('should fill orders when right order has better price with less needed amount', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '300'),
        ZERO,
        Asset('0x00000000', '0x', '50'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const fill = await lib.fillOrder(left, right, 0, 0, false, false);
      expect(fill[0]).to.equal(50);
      expect(fill[1]).to.equal(100);
    });

    it('should throw if price is not ok', async () => {
      const left = Order(
        ZERO,
        Asset('0x00000000', '0x', '100'),
        ZERO,
        Asset('0x00000000', '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        ZERO,
        Asset('0x00000000', '0x', '199'),
        ZERO,
        Asset('0x00000000', '0x', '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      await expect(lib.fillOrder(left, right, 0, 0, false, false)).to.be.revertedWith('fillRight: unable to fill');
    });
  });
});
