async function main() {
    const App = await ethers.getContractFactory('VotingApp');
    const app = await App.deploy();
    console.log(`App address: ${app.address}`);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});