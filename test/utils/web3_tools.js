/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {createWeb3, getBalance, getDefaultAddress, maximalGasPrice} from '../../src/utils/web3_tools';
import BN from 'bn.js';

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Web3 tools', () => {
  let web3;
  let address;

  before(async () => {
    web3 = await createWeb3();
    address = getDefaultAddress(web3);
  });

  describe('getBalance', () => {
    it(`returns user's balance`, async () => {
      const realBalance = await web3.eth.getBalance(address);
      expect((await getBalance(web3, address)).toString()).to.equal(realBalance);
    });

    it('returns big number', async () => {
      expect(await getBalance(web3, address) instanceof BN).to.be.true;
    });
  });

  it('maximalGasPrice returns correct value', () => {
    expect(maximalGasPrice().toString()).to.equal('40000000000000000');
  });
});
