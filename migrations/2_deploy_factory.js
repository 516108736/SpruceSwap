const editJsonFile = require("edit-json-file");
const stripHexPrefix = require('strip-hex-prefix');
const fs = require('fs');

var REGEX = /hex'(.{64,})/g;

const OutPutFile = './cList.json'

function resetContractFile() {
  fs.unlink(OutPutFile, function(error) {
    if (error) {
      console.log(error);
      return false;
    }
    console.log('reset file succ');
  })
}

function replace(path, regex, replacedContent) {
  var fileContent = fs.readFileSync(path, 'utf8');
  fileContent = fileContent.replace(regex, replacedContent);
  fs.writeFileSync(path, fileContent);
}

// contracts
const Factory = artifacts.require("UniswapV2Factory");
const ERC20 = artifacts.require("MyERC20")
// contracts
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const UniswapV2Library = artifacts.require("UniswapV2Library");
const SafeMath = artifacts.require("SafeMath");
const StakingRewards = artifacts.require("StakingRewards");

const swapDeadLine = 1956981781
const stakingRewardsDuration = 63072000

// deploy swap factory
module.exports = async function(deployer, network, accounts) {

  resetContractFile()

  var json = []

  for (tIndex = 0; tIndex < 3; tIndex++) {
    let myMap = new Map();
    var erc20Name = new Array()
    var erc20List = new Array()
    for (i = 0; i < 4; i++) {
      const name = "Token" + i
      await deployer.deploy(ERC20, name, 9000000000000000)
      const erc20Instance = await ERC20.deployed()
      erc20List[i] = erc20Instance.address
      myMap.set(name, erc20Instance.address)
    }




    await deployer.deploy(ERC20, "FakeWETH", 9000000000000000)
    const fakeWETHInstance = await ERC20.deployed()
    var fakewethAddress = fakeWETHInstance.address
    myMap.set("FakewethAddress", fakewethAddress)


    await deployer.deploy(Factory, accounts[0]);
    const factoryInstance = await Factory.deployed();
    const hash = await factoryInstance.pairCodeHash();
    var factoryAddress = factoryInstance.address
    var replacedContent = "hex'" + stripHexPrefix(hash) + "'"
    replace(`${__dirname}/../contracts/swap/router/libraries/UniswapV2Library.sol`, REGEX, replacedContent);


    await deployer.deploy(UniswapV2Library);
    await deployer.link(UniswapV2Library, UniswapV2Router02);
    await deployer.deploy(SafeMath);
    await deployer.link(SafeMath, UniswapV2Router02);
    await deployer.deploy(UniswapV2Router02, factoryAddress, fakewethAddress);
    const routerInstance = await UniswapV2Router02.deployed();
    var routerAddress = routerInstance.address



    myMap.set("Factory", factoryAddress)
    myMap.set("Router", routerAddress)

    var depositAmount = 4000000000000000

    for (i = 0; i < erc20List.length; i++) {
      const erc20I = await ERC20.at(erc20List[i])
      await erc20I.approve(routerAddress, depositAmount)
    }

    await routerInstance.addLiquidity(erc20List[0], erc20List[1], 3000000000000000, 3000000000000000, 0, 0, accounts[0], swapDeadLine)
    await routerInstance.addLiquidity(erc20List[2], erc20List[3], 3000000000000000, 3000000000000000, 0, 0, accounts[0], swapDeadLine)
    var lp1 = await routerInstance.pairFor(erc20List[0], erc20List[1])
    var lp2 = await routerInstance.pairFor(erc20List[2], erc20List[3])

    myMap.set("Lp1", lp1)
    myMap.set("Lp2", lp2)


    await routerInstance.swapExactTokensForTokens(1000000000000000, 0, [erc20List[0], erc20List[1]], accounts[0], swapDeadLine)
    await routerInstance.swapExactTokensForTokens(1000000000000000, 0, [erc20List[2], erc20List[3]], accounts[0], swapDeadLine)


    // deploy lp1 mining
    await deployer.deploy(StakingRewards, accounts[0], erc20List[0], lp1, stakingRewardsDuration);
    var stakingRewardInstance = await StakingRewards.deployed();
    myMap.set("StakingRewards1", stakingRewardInstance.address);


    var erc20I = await ERC20.at(lp1)
    var balance = await erc20I.balanceOf(accounts[0])
    await erc20I.approve(stakingRewardInstance.address, balance)
    await stakingRewardInstance.stake(100)



    erc20I = await ERC20.at(erc20List[0])
    balance = await erc20I.balanceOf(accounts[0])
    await erc20I.transfer(stakingRewardInstance.address, balance / 2)
    await stakingRewardInstance.notifyRewardAmount(balance / 2)
    await stakingRewardInstance.getReward()

    // deploy lp2 mining
    await deployer.deploy(StakingRewards, accounts[0], erc20List[2], lp2, stakingRewardsDuration);
    var stakingRewardInstance = await StakingRewards.deployed();
    myMap.set("StakingRewards2", stakingRewardInstance.address);


    var erc20I = await ERC20.at(lp2)
    var balance = await erc20I.balanceOf(accounts[0])
    await erc20I.approve(stakingRewardInstance.address, balance)
    await stakingRewardInstance.stake(100)



    erc20I = await ERC20.at(erc20List[2])
    balance = await erc20I.balanceOf(accounts[0])
    await erc20I.transfer(stakingRewardInstance.address, balance / 2)
    await stakingRewardInstance.notifyRewardAmount(balance / 2)
    await stakingRewardInstance.getReward()

    console.log("--- index ---", tIndex)

    json.push(Object.fromEntries(myMap))
  }
  fs.writeFileSync(OutPutFile, JSON.stringify(json), (err) => {
    if (err) console.log("err", err)
  })
};
