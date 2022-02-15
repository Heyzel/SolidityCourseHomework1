const {expect} = require('chai');

describe('App contract', () => {
    let App, app, owner;

    beforeEach(async () => {
        App = await ethers.getContractFactory('VotingApp');
        app = await App.deploy();
        [owner, user, cand1, cand2, cand3, cand4, cand5, cand6] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });
    });

    describe('tests for setPositions', () => {
        it('Cannot be called by users', async () => {
            await expect(app.connect(user).setPositions(["President", "Mayor"])).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Should assign positions only by owner', async () => {
            const positions = ["President", "Mayor"];
            app.connect(owner).setPositions(positions);
            const result = await app.connect(user).getIsPosition();
            expect(result[0]).to.equal(positions[0]);
            expect(result[1]).to.equal(positions[1]);
        });
    });

    describe('test for setCandidate', () => {
        it('Should fail if pass more than 5 candidates', async () => {
            const candidates = [
                {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['President']},
                {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['President']},
                {name:'Candidate 4', addr: cand4.address, postulatedPositions: ['President']},
                {name:'Candidate 5', addr: cand5.address, postulatedPositions: ['President']},
                {name:'Candidate 6', addr: cand6.address, postulatedPositions: ['President']}
            ];
            await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('There cannot be more than 5 candidates in total');
        });

        it('Should fail if pass more than 5 candidates in different calls', async () => {
            const candidates = [
                {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['President']},
                {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['President']}
            ];
            await app.connect(owner).setCandidate(candidates);
            const candidates = [
                {name:'Candidate 4', addr: cand4.address, postulatedPositions: ['President']},
                {name:'Candidate 5', addr: cand5.address, postulatedPositions: ['President']},
                {name:'Candidate 6', addr: cand6.address, postulatedPositions: ['President']}
            ];
            await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('There cannot be more than 5 candidates in total');
        });

        it('Should fail if pass a candidate already registered', async () => {
            app.connect(owner).setPositions(['President', 'Mayor']);
            const candidates = [
                {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['Mayor']},
                {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['President']}
            ];
            await app.connect(owner).setCandidate(candidates);
            candidates = [{name:'Candidate 2', addr: cand2.address, postulatedPositions: ['President']}];
            await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('The candidate is already registered');
        });

        it('Should fail if a candidate is postulating for a position that does not exist', async () => {
            app.connect(owner).setPositions(['President', 'Mayor']);
            const candidates = [
                {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['Mayor']},
                {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['Governer']}
            ];
        })
    });

});