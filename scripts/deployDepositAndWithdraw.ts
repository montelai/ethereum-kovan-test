const hre = require("hardhat");
import { Contract, ContractFactory, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import usdtABI from "../artifacts/contracts/interfaces/IERC20.sol/IERC20.json";
import ausdtABI from "../artifacts/contracts/interfaces/IAToken.sol/IAToken.json";

const AMOUNT_OF_USDT = 5000000
const USDT_ADDRESS = "0x13512979ADE267AB5100878E2e0f485B568328a4"
const AUSDT_ADDRESS = "0xFF3c8bc103682FA918c954E84F5056aB4DD5189d"

async function main() {
    const signer = (await ethers.getSigners())[0];
    const Vault = await ethers.getContractFactory("Vault");
    const vaultProxy: Contract = await upgrades.deployProxy(Vault, [], {initializer: "initializable"});
    await vaultProxy.deployed();
    console.log(`Proxy Deployed to: ${vaultProxy.address}`);

    // //approve usdt spending
    const USDT:Contract = new ethers.Contract(USDT_ADDRESS, usdtABI.abi, signer);
    const usdt:Contract = USDT.connect(signer);
    await usdt.approve(vaultProxy.address, AMOUNT_OF_USDT);

    // //deposit
    await vaultProxy.deposit(USDT_ADDRESS, AMOUNT_OF_USDT);

    // //check vault's ausdt balance 
    const AUSDT: Contract = new ethers.Contract(AUSDT_ADDRESS, ausdtABI.abi, signer);
    const aUSDT: Contract = AUSDT.connect(signer);
    const aUSDTBalance: number = (await aUSDT.balanceOf(vaultProxy.address)).toNumber();
    console.log(`AUSDT Balance: ${aUSDTBalance}`);

    //check vault price
    const priceInEth: number = (await vaultProxy.connect(signer).checkCollateralValueInEth()).toNumber();
    console.log(`Vault Balance in Eth: ${priceInEth}`);

    //withdraw
    await vaultProxy.withdraw(USDT_ADDRESS, ethers.constants.MaxUint256);

    //check signer balance to be principal + interest
    const signerUSDTBalance: number = (await usdt.balanceOf(signer.address)).toNumber();
    console.log(`Signer's new balance of USDT: ${signerUSDTBalance}`);

  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });