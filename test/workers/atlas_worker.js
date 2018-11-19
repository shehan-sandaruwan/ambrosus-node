/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import AtlasWorker from '../../src/workers/atlas_worker';
import AtlasChallengeParticipationStrategy from '../../src/workers/atlas_strategies/atlas_challenge_resolution_strategy';

chai.use(sinonChai);
chai.use(chaiAsPromised);
const {expect} = chai;

describe('Atlas Worker', () => {
  const defaultAccount = '0x123';
  const fetchedBundle = {bundleId: 'fetchedBundle'};
  const workerInterval = 10;
  let atlasWorker;
  let challengesRepositoryMock;
  let dataModelEngineMock;
  let mockWorkerLogRepository;
  let strategyMock;
  let loggerMock;
  let shouldFetchBundleStub;
  let shouldResolveChallengeStub;
  let mockWeb3;

  beforeEach(() => {
    mockWeb3 = {
      eth: {
        defaultAccount
      }
    };
    challengesRepositoryMock = {
      ongoingChallenges: sinon.stub(),
      resolveChallenge: sinon.stub()
    };
    dataModelEngineMock = {
      downloadBundle: sinon.stub().resolves(fetchedBundle),
      cleanupBundles: sinon.spy(),
      updateShelteringExpirationDate: sinon.stub()
    };
    mockWorkerLogRepository = {
      storeLog: sinon.stub()
    };
    strategyMock = new AtlasChallengeParticipationStrategy();
    sinon.stub(strategyMock, 'workerInterval').get(() => workerInterval);
    shouldFetchBundleStub = sinon.stub(strategyMock, 'shouldFetchBundle').resolves(true);
    shouldResolveChallengeStub = sinon.stub(strategyMock, 'shouldResolveChallenge').resolves(true);
    sinon.stub(strategyMock, 'afterChallengeResolution');
    loggerMock = {
      info: sinon.spy(),
      error: sinon.spy()
    };
    atlasWorker = new AtlasWorker(mockWeb3, dataModelEngineMock, mockWorkerLogRepository, challengesRepositoryMock, strategyMock, loggerMock);
  });

  it('copies the work interval from the strategy', () => {
    expect(atlasWorker.interval).to.equal(workerInterval);
  });

  describe('Challenge resolution', () => {
    const sheltererId = 'shelterer';
    const bundleId = 'bundle';
    const challengeId = 'challenge';
    const challenge1 = {sheltererId, bundleId, challengeId, bundleNumber: 1};
    const challenge2 = {sheltererId: 2, bundleId: 12, challengeId: 6, bundleNumber: 2};
    const challenge3 = {sheltererId: 5, bundleId: 6, challengeId: 2, bundleNumber: 3};
    const challenges = [
      challenge1,
      challenge2,
      challenge3
    ];

    it('tryToDownload downloads the bundle', async () => {
      expect(await atlasWorker.tryToDownload(challenge1)).to.equal(fetchedBundle);
      expect(dataModelEngineMock.downloadBundle).to.be.calledWith(bundleId, sheltererId);
    });

    it('tryToResolve resolves a challenge and sets expiration date', async () => {
      await atlasWorker.tryToResolve(fetchedBundle, challenge1);
      expect(challengesRepositoryMock.resolveChallenge).to.be.calledWith(challengeId);
      expect(dataModelEngineMock.updateShelteringExpirationDate).to.be.calledWith(fetchedBundle.bundleId);
    });

    describe('tryWithChallenge', () => {
      let tryToDownloadMock;
      let tryToResolveMock;
      const bundle = 'bundle';

      beforeEach(() => {
        tryToDownloadMock = sinon.stub(atlasWorker, 'tryToDownload');
        tryToResolveMock = sinon.stub(atlasWorker, 'tryToResolve');

        shouldFetchBundleStub.returns(true);
        tryToDownloadMock.resolves(bundle);
        shouldResolveChallengeStub.returns(true);
        tryToResolveMock.resolves();
      });

      afterEach(() => {
        tryToDownloadMock.restore();
        tryToResolveMock.restore();
      });

      it('returns false if the strategy disqualifies the challenge', async () => {
        shouldFetchBundleStub.returns(false);
        expect(await atlasWorker.tryWithChallenge(challenge1)).to.equal(false);
        expect(tryToDownloadMock).to.not.have.been.called;
      });

      it('returns false if download attempt of bundle fails', async () => {
        tryToDownloadMock.throws();
        expect(await atlasWorker.tryWithChallenge(challenge1)).to.equal(false);
        expect(tryToDownloadMock).to.have.been.calledWith(challenge1);
      });

      it('returns false if the strategy disqualifies the challenge after downloaded the bundle', async () => {
        shouldResolveChallengeStub.returns(false);
        expect(await atlasWorker.tryWithChallenge(challenge1)).to.equal(false);
        expect(shouldResolveChallengeStub).to.have.been.calledWith('bundle');
        expect(tryToResolveMock).to.not.have.been.called;
      });

      it('returns false if the resolution attempt fails', async () => {
        tryToResolveMock.throws();
        expect(await atlasWorker.tryWithChallenge(challenge1)).to.equal(false);
        expect(tryToResolveMock).to.have.been.calledWith(bundle, challenge1);
      });

      it('returns true if everything goes ok', async () => {
        expect(await atlasWorker.tryWithChallenge(challenge1)).to.equal(true);
        expect(strategyMock.afterChallengeResolution).to.have.been.calledWith(bundle);
      });
    });

    describe('periodicWork', () => {
      let tryWithChallengeMock;
      beforeEach(() => {
        challengesRepositoryMock.ongoingChallenges.resolves(challenges);
        tryWithChallengeMock = sinon.stub(atlasWorker, 'tryWithChallenge');
      });

      afterEach(() => {
        tryWithChallengeMock.restore();
      });

      it('gets ongoing challenges', async () => {
        await atlasWorker.periodicWork();
        expect(challengesRepositoryMock.ongoingChallenges).to.be.calledOnce;
      });

      it('tries to resolve challenges in order until it succeeds', async () => {
        tryWithChallengeMock.withArgs(challenge1).resolves(false);
        tryWithChallengeMock.withArgs(challenge2).resolves(true);
        await atlasWorker.periodicWork();
        expect(tryWithChallengeMock).to.have.been.calledWith(challenge1);
        expect(tryWithChallengeMock).to.have.been.calledWith(challenge2);
        expect(tryWithChallengeMock).to.not.have.been.calledWith(challenge3);
      });

      // it('calls cleanupBundles', async () => {
      //   await atlasWorker.periodicWork();
      //   expect(dataModelEngineMock.cleanupBundles).to.be.calledOnce;
      // });
    });
  });
});
