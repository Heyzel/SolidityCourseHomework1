const {expect} = require('chai');

describe('App contract', () => {
    let App, app, owner;

    beforeEach(async () => {
        App = await ethers.getContractFactory('VotingApp');
        app = await App.deploy();
        owner = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });
    });

    describe('')

});