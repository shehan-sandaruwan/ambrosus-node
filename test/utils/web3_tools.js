/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {createWeb3, isSyncing} from '../../src/utils/web3_tools';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const {expect} = chai;

describe('Web3 tools', () => {
  let web3;

  before(async () => {
    web3 = await createWeb3();
  });

  describe('isSyncing', () => {
    let isSyncingStub;

    before(() => {
      isSyncingStub = sinon.stub(web3.eth, 'isSyncing');
    });

    after(() => {
      isSyncingStub.restore();
    });

    it('returns false when web3.eth.isSyncing returns false', async () => {
      isSyncingStub.resolves(false);
      expect(await isSyncing(web3)).to.be.false;
      expect(isSyncingStub).to.be.calledOnce;
    });

    it('returns false when highestBlock equals currentBlock', async () => {
      isSyncingStub.resolves({
        currentBlock: 312,
        highestBlock: 312
      });
      expect(await isSyncing(web3)).to.be.false;
    });

    it('returns true when highestBlock > currentBlock', async () => {
      isSyncingStub.resolves({
        currentBlock: 312,
        highestBlock: 512
      });
      expect(await isSyncing(web3)).to.be.true;
    });
  });
});
