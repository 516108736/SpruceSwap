const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
require('dotenv').config({path: '../.env'})
const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const Contract = require('../build/contracts/StakingRewards.json');
const ERC20 = require('../build/contracts/ERC20.json');

const MNEMONIC = process.env.MNEMONIC.split(',');
const URL = process.env.TESTNET_URL;

const RewardsTokenAddr = file.get("spruce")
const MiningAddress = "0xEa6414A15a76B1D7637A44d139CC4167f0A17064"
const AMOUNT = "1000000"

//Easy way (Web3 + @truffle/hdwallet-provider)
notify = async () => {
    const provider = new Provider(MNEMONIC, URL, 0, 2);
    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();

    const ERC20Instance = new web3.eth.Contract(
        ERC20.abi,
        RewardsTokenAddr
    );

    const instance = new web3.eth.Contract(
        Contract.abi,
        MiningAddress
    );

    await web3.eth.getAccounts().then(async accounts => {
        var receipt = await ERC20Instance.methods.transfer(MiningAddress, web3.utils.toWei(AMOUNT)).send({
            from: accounts[0],
            gasPrice: web3.utils.toWei("1", "gwei")
        });
        console.log(`Transaction hash: ${receipt.transactionHash}`);

        receipt = await instance.methods.notifyRewardAmount(web3.utils.toWei(AMOUNT)).send({
            from: accounts[0],
            gasPrice: web3.utils.toWei("1", "gwei")
        });
        console.log(`Transaction hash: ${receipt.transactionHash}`);
    });
}

notify()