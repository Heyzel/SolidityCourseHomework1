const { upgrades } = require('hardhat');

async function main () {
  const App = await ethers.getContractFactory('VotingApp');
  const app = await upgrades.deployProxy(App);
  await app.deployed();
  console.log('App deployed to:', app.address);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});