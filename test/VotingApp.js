const {expect} = require('chai');
const { network, ethers } = require('hardhat');

describe('App contract', () => {
    let App, app, owner;

    beforeEach(async () => {
        App = await ethers.getContractFactory('VotingApp');
        app = await App.deploy();
        [owner, user, user2, cand1, cand2, cand3, cand4, cand5, cand6] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });
    });
    
    describe('Tests for modifiers', () => {

        describe('OnlyOwner: should fail if a user try call it', () => {

            it('for setPositions', async () => {
                const positions = ['President, Mayor'];
                await expect(app.connect(user).setPositions(positions)).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('for setCandidate', async () => {
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await expect(app.connect(user).setCandidate(candidates)).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('for startVoting', async () => {
                await expect(app.connect(user).startVoting()).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('for resetVoting', async () => {
                await expect(app.connect(user).resetVoting()).to.be.revertedWith('Ownable: caller is not the owner');
            })
        });

        describe('isNotVotingPeriod: should fail if we are in voting period', () => {
            
            beforeEach(async () => {
                const auxPositions = ['President'];
                await app.connect(owner).setPositions(auxPositions);
                const auxCandidates = [{name: 'Candidate 2', addr: cand2.address, postulatedPositions: ['President']}];
                await app.connect(owner).setCandidate(auxCandidates);
                await app.connect(owner).startVoting();
            });

            it('for setPositions', async () => {
                const positions = ['Governer, Mayor'];
                await expect(app.connect(owner).setPositions(positions)).to.be.revertedWith('We are in voting period.')
            });

            it('for setCandidate', async () => {
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('We are in voting period.');
            });

            it('for startVoting', async () => {
                await expect(app.connect(owner).startVoting()).to.be.revertedWith("We are in voting period.");
            });

            it('for Register', async () => {
                await expect(app.connect(owner).Register()).to.be.revertedWith("We are in voting period.");
            });

            it('for resetVoting', async () => {
                await expect(app.connect(owner).resetVoting()).to.be.revertedWith("We are in voting period.");
            });
        });

        describe('isVotingPeriod: should fail if we are not in voting period', () => {
            it('for Voting', async () => {
                const votes = [{position: 'President', addr: cand1.address}];
                await expect(app.connect(user).Voting(votes)).to.be.revertedWith('We are not in voting period.');
            });
        }); 
    });

    describe('Tests requires for functions', () => {
    
        describe('for setCandidate', () => {
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
                app.connect(owner).setPositions(['President']);
                let candidates = [
                    {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                    {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['President']},
                    {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['President']}
                ];
                await app.connect(owner).setCandidate(candidates);
                candidates = [
                    {name:'Candidate 4', addr: cand4.address, postulatedPositions: ['President']},
                    {name:'Candidate 5', addr: cand5.address, postulatedPositions: ['President']},
                    {name:'Candidate 6', addr: cand6.address, postulatedPositions: ['President']}
                ];
                await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('There cannot be more than 5 candidates in total');
            });
    
            // ################### testing for postingCandidate inside setCandidate ##################### //
    
            it('Should fail if a candidate is postulating for a position that does not exist', async () => {
                app.connect(owner).setPositions(['President', 'Mayor']);
                const candidates = [
                    {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                    {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['Mayor']},
                    {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['Governer']}
                ];
                await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('The voting is not for all these positions.')
            });
    
            it('Should fail if pass a candidate already registered', async () => {
                app.connect(owner).setPositions(['President', 'Mayor']);
                let candidates = [
                    {name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                    {name:'Candidate 2', addr: cand2.address, postulatedPositions: ['Mayor']},
                    {name:'Candidate 3', addr: cand3.address, postulatedPositions: ['President']}
                ];
                await app.connect(owner).setCandidate(candidates);
                candidates = [{name:'Candidate 2', addr: cand2.address, postulatedPositions: ['President']}];
                await expect(app.connect(owner).setCandidate(candidates)).to.be.revertedWith('The candidate is already registered');
            });
        });
    
        describe('for Register', () => {
            it('Should fail if try register and you are already registered', async () => {
                await app.connect(user).Register();
                await expect(app.connect(user).Register()).to.be.revertedWith("You are already registered.");
            });
        });
        
        describe('for Voting', () => {
            it('Should fail if the user already vote', async () => {
                const positions = ["President"];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(user).Register();
                await app.connect(owner).startVoting();
                const vote = [{position:'President', addr: cand1.address}];
                await app.connect(user).Voting(vote);
                await expect(app.connect(user).Voting(vote)).to.be.revertedWith('You already vote.');
            });
    
            it('Should fail if the user is not registered', async () => {
                const positions = ["President"];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(owner).startVoting();
                const vote = [{position:'President', addr: cand1.address}];
                await expect(app.connect(user).Voting(vote)).to.be.revertedWith('You are not registered.');
            });

            // #################### testing for RegisteringVote inside Voting ################### //

            it('Should fail if the user vote for someone who is not a candidate', async () => {
                const positions = ["President"];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(user).Register();
                await app.connect(owner).startVoting();
                const vote = [{position:'President', addr: cand2.address}];
                await expect(app.connect(user).Voting(vote)).to.be.revertedWith('This address does not belong to any candidate.');
            });

            it('Should fail if the user vote for a candidate who is not running for that position', async () => {
                const positions = ["President"];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(user).Register();
                await app.connect(owner).startVoting();
                const vote = [{position:'Mayor', addr: cand1.address}];
                await expect(app.connect(user).Voting(vote)).to.be.revertedWith('This candidate is not running for this position.');
            });

            it('Should fail if the user is a candidate voting for himself', async () => {
                const positions = ["President"];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(cand1).Register();
                await app.connect(owner).startVoting();
                const vote = [{position:'President', addr: cand1.address}];
                await expect(app.connect(cand1).Voting(vote)).to.be.revertedWith("You can't vote for yourself.");
            });

            it('Should fail if the user try 2 times for the same position', async () => {
                const positions = ["President"];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                                    {name:'Candidate 2', addr: cand2.address, postulatedPositions:['President']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(user).Register();
                await app.connect(owner).startVoting();
                const vote = [{position:'President', addr: cand1.address},
                            {position:'President', addr: cand2.address}];
                await expect(app.connect(user).Voting(vote)).to.be.revertedWith('You already vote for this position.');
            });
            
        });

        describe('for startVoting', () => {
            it('Should fail if try start a voting without candidates', async () => {
                await expect(app.connect(owner).startVoting()).to.be.revertedWith("You cannot start voting without candidates");
            });
        });

        describe('for resetVoting', () => {
            it('Should fail if try reset a voting without starting', async () => {
                await expect(app.connect(owner).resetVoting()).to.be.revertedWith("Only can reset voting after a voting.");
            })
        })
    });
    
    describe('Tests for events', () => {
        it('for RegisteredSuccessfully', async () => {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await app.connect(user).Register()).to.emit(app, 'RegisteredSuccessfully').withArgs(user.address, timestampBefore+1);
        });

        it('for NewCandidate', async () => {
            const positions = ["President", "Mayor"];
            await app.connect(owner).setPositions(positions);
            const candidates = [{name: 'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                                {name: 'Candidate 2', addr: cand2.address, postulatedPositions: ['Mayor']}]; 
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await app.connect(owner).setCandidate(candidates))
            .to.emit(app, 'NewCandidate').withArgs(candidates[0].name, candidates[0].addr, candidates[0].postulatedPositions, timestampBefore+1)
            .to.emit(app, 'NewCandidate').withArgs(candidates[1].name, candidates[1].addr, candidates[1].postulatedPositions, timestampBefore+1);
        });

        it('for NewVote', async () => {
            const positions = ["President", "Mayor"];
            await app.connect(owner).setPositions(positions);
            const candidates = [{name:'Candidate 1', addr: cand1.address, postulatedPositions: ['President', 'Mayor']}];
            await app.connect(owner).setCandidate(candidates);
            await app.connect(user).Register();
            await app.connect(owner).startVoting();
            const vote = [{position:'President', addr: cand1.address},
                        {position: 'Mayor', addr: cand1.address}];

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await app.connect(user).Voting(vote))
            .to.emit(app, 'NewVote').withArgs(user.address, vote[0].addr, vote[0].position, timestampBefore+1)
            .to.emit(app, 'NewVote').withArgs(user.address, vote[1].addr, vote[1].position, timestampBefore+1);
        });

        it('for VotingStarted', async () => {
            const positions = ["President", "Mayor"];
            await app.connect(owner).setPositions(positions);
            const candidates = [{name: 'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                                {name: 'Candidate 2', addr: cand2.address, postulatedPositions: ['Mayor']}]; 
            await app.connect(owner).setCandidate(candidates);
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await app.connect(owner).startVoting())
            .to.emit(app, 'VotingStarted')
            .withArgs(timestampBefore + 1, timestampBefore + 604800 + 1, candidates.length);
        });
    });
    
    describe('Tests that functions works correct', () => {
        
        describe('for setPositions', () => {

            it('Should assign positions correctly', async () => {
                const positions = ["President", "Governer", "Mayor", "Minister"];
                app.connect(owner).setPositions(positions);
                const result = await app.connect(user).getIsPosition();
                expect(result[0]).to.equal(positions[0]);
                expect(result[1]).to.equal(positions[1]);
                expect(result[2]).to.equal(positions[2]);
                expect(result[3]).to.equal(positions[3]);
            });
        });

        describe('for setCandidate', () => {
                
            it('Should assign candidates correctly', async () => {
                const positions = ['President'];
                app.connect(owner).setPositions(positions);
                const candidates = [{name: 'Candidate 1', addr: cand1.address, postulatedPositions: ['President']},
                                    {name: 'Candidate 2', addr: cand2.address, postulatedPositions: ['President']},
                                    {name: 'Candidate 3', addr: cand3.address, postulatedPositions: ['President']},
                                    {name: 'Candidate 4', addr: cand4.address, postulatedPositions: ['President']}];
                app.connect(owner).setCandidate(candidates);
                const result = await app.connect(user).getCandidates();
                for(let i = 0; i < candidates.length; i++){
                    expect(result[i].name).to.equal(candidates[i].name);
                    expect(result[i].addr).to.equal(candidates[i].addr);
                    for(let j = 0; j < candidates[i].postulatedPositions.length; j++){
                        expect(result[i].postulatedPositions[j]).to.equal(candidates[i].postulatedPositions[j]);
                    }
                }
            });
        });
        
        describe('for Register', () => {

            it('Should register the user correctly', async () => {
                app.connect(user).Register();
                const result = await app.connect(user).getUser(user.address);
                expect(result.isRegistered).to.equal(true);
                expect(result.alreadyVoted).to.equal(false);
                expect(result.votedPositions.length).to.equal(0);
            });
        });
        
        describe('for Voting', () => {

            it('Should count votes correctly and register the voters', async () => {
                await app.connect(user).Register();
                await app.connect(user2).Register();
                await app.connect(cand1).Register();
                await app.connect(cand2).Register();
                const positions = ['President', 'Governer', 'Mayor'];
                await app.connect(owner).setPositions(positions);
                const candidates = [{name: 'Candidate 1', addr: cand1.address, postulatedPositions: ['President', 'Governer', 'Mayor']},
                                    {name: 'Candidate 2', addr: cand2.address, postulatedPositions: ['President', 'Governer', 'Mayor']},
                                    {name: 'Candidate 3', addr: cand3.address, postulatedPositions: ['President', 'Governer', 'Mayor']}];
                await app.connect(owner).setCandidate(candidates);
                await app.connect(owner).startVoting();
                const userVotes = [{position: 'President', addr: cand1.address}, {position: 'Governer', addr: cand2.address}, {position: 'Mayor', addr: cand3.address}]; // <--- No problems with this vote
                const user2Votes = [{position: 'President', addr: cand1.address}, {position: 'Mayor', addr: cand3.address}]; // <--- It is not necessary to vote in all positions
                const cand1Votes = [{position: 'President', addr: cand2.address}, {position: 'Governer', addr: cand2.address}, {position: 'Mayor', addr: cand3.address}];
                const cand2Votes = [{position: 'President', addr: cand1.address}, {position: 'Governer', addr: cand1.address}, {position: 'Mayor', addr: cand3.address}]; // <--- Is possible vote for the same candidate in differents positions
                await app.connect(user).Voting(userVotes);
                await app.connect(user2).Voting(user2Votes);
                await app.connect(cand1).Voting(cand1Votes);
                await app.connect(cand2).Voting(cand2Votes);
                expect(await app.connect(user).getCounter('President', cand1.address)).to.equal(3);
                expect(await app.connect(user).getCounter('President', cand2.address)).to.equal(1);
                expect(await app.connect(user).getCounter('President', cand3.address)).to.equal(0);
                expect(await app.connect(user).getCounter('Governer', cand1.address)).to.equal(1);
                expect(await app.connect(user).getCounter('Governer', cand2.address)).to.equal(2);
                expect(await app.connect(user).getCounter('Governer', cand3.address)).to.equal(0);
                expect(await app.connect(user).getCounter('Mayor', cand1.address)).to.equal(0);
                expect(await app.connect(user).getCounter('Mayor', cand2.address)).to.equal(0); 
                expect(await app.connect(user).getCounter('Mayor', cand3.address)).to.equal(4);
            });
        });
        
        describe('for resetVoting', () => {
            it('Should set variables to 0 and arrays to void', async () => {
                app.connect(user).Register();
                const positions = ['President', 'Governer'];
                app.connect(owner).setPositions(positions);
                const candidates = [{name: 'Candidate 1', addr: cand1.address, postulatedPositions: ['President', 'Governer']},
                                    {name: 'Candidate 2', addr: cand2.address, postulatedPositions: ['President', 'Governer']}];
                app.connect(owner).setCandidate(candidates);
                app.connect(owner).startVoting();
                const userVotes = [{position: 'President', addr: cand1.address}, {position: 'Governer', addr: cand2.address}];
                await app.connect(user).Voting(userVotes);
                const blockNumBefore = await ethers.provider.getBlockNumber();
                const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                const timestampBefore = blockBefore.timestamp;
                await network.provider.send("evm_increaseTime", [604801]);
                app.connect(owner).resetVoting();
                expect(await app.connect(user).getCounter(positions[0], cand1.address)).to.be.equal(0);
                expect(await app.connect(user).getCounter(positions[0], cand2.address)).to.be.equal(0);
                expect(await app.connect(user).getCounter(positions[1], cand1.address)).to.be.equal(0);
                expect(await app.connect(user).getCounter(positions[1], cand2.address)).to.be.equal(0);
                let result = await app.connect(user).getCandidates();
                expect(result.length).to.be.equal(0);
                result = await app.connect(user).getIsPosition();
                expect(result.length).to.be.equal(0);
                expect(await app.connect(user).getTimestart()).to.be.equal(0);
            });
        });
    });

});