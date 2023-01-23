import {expect} from '../test/utils/chai-setup';
import {LibSignatureTest} from '../typechain';
import hre, {ethers} from 'hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {privateToAddress, toBuffer, ecsign, bufferToInt} from 'ethereumjs-util';

describe('LibSignature Test', async function () {
  let wallet1: SignerWithAddress;
  let lib: LibSignatureTest;

  before(async function () {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    const LibSignatureTest = await ethers.getContractFactory('LibSignatureTest');
    lib = await LibSignatureTest.deploy();
  });

  it("should return correct signer, case: v > 30", async () => {
		const msg = "myMessage";
		const hash = await lib.getKeccak(msg)

		const signature = await signPersonalMessage(hash, wallet1);
		const sig2 = signature.r + signature.s.substr(2) + (signature.v + 4).toString(16)
		const signer = await lib.recoverFromSigTest(hash, sig2);

        expect(signer).to.equal(wallet1.address);
	});

	it("should return correct signer, default case: v < 30", async () => {
		const msg = "hello world";
		const hash = await lib.getKeccak(msg)

		//some random privateKey
		const privateKey = Buffer.from("f1a884c5c58e8770b294e7db47eadc8ac5c5466211aa109515268c881c921ec4", "hex")

		//getting ethereum address of the given private key
		const realSigner = hre.web3.utils.toChecksumAddress("0x" + privateToAddress(privateKey).toString('hex'))

		const signature = ecsign(toBuffer(hash), privateKey);
		const sig2 = "0x" + signature.r.toString('hex') + signature.s.toString('hex') + signature.v.toString(16)
		const signer = await lib.recoverFromSigTest(hash, sig2);

        expect(signer).to.equal(realSigner);

	});

    async function signPersonalMessage(message: any, account: SignerWithAddress) {
        const signature = (await hre.web3.eth.sign(message, account.address)).substr(2, 130);
        const v = bufferToInt(Buffer.from(signature.substr(128, 2), "hex"));
        return {
            v: (v < 27 ? (v + 27) : v),
            r: ("0x" + signature.substr(0, 64)),
            s: ("0x" + signature.substr(64, 64))
        };
    }
});
