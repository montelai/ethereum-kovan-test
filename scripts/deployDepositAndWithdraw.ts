const hre = require("hardhat");
import { Contract, ContractFactory, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import usdtABI from "../artifacts/contracts/interfaces/IERC20.sol/IERC20.json";
import ausdtABI from "../artifacts/contracts/interfaces/IAToken.sol/IAToken.json";

const AMOUNT_OF_USDT = 5000000

async function main() {
    const signer = (await ethers.getSigners())[0];
    const Vault = await ethers.getContractFactory("Vault");
    // const vaultProxy = Vault.attach("0x46dCBff7Fc6D6D3565095D64DB22986d039896DE")
    const vaultProxy: Contract = await upgrades.deployProxy(Vault, [], {initializer: "initializable"});
    await vaultProxy.deployed();
    console.log(`Proxy Deployed to: ${vaultProxy.address}`);

    //checking v1
    // console.log(vaultProxy._implementation())

    //checking v2

    // //approve usdt spending
    const USDT:Contract = new ethers.Contract("0x13512979ADE267AB5100878E2e0f485B568328a4", usdtABI.abi, signer);
    const usdt:Contract = USDT.connect(signer);
    await usdt.approve(vaultProxy.address, AMOUNT_OF_USDT);

    // //deposit
    await vaultProxy.deposit("0x13512979ADE267AB5100878E2e0f485B568328a4", AMOUNT_OF_USDT);

    // //check vault's ausdt balance 
    const AUSDT: Contract = new ethers.Contract("0xFF3c8bc103682FA918c954E84F5056aB4DD5189d", ausdtABI.abi, signer);
    const aUSDT: Contract = AUSDT.connect(signer);
    const aUSDTBalance: number = (await aUSDT.balanceOf(vaultProxy.address)).toNumber();
    console.log(`AUSDT Balance: ${aUSDTBalance}`);

    //check vault price
    const priceInEth: number = (await vaultProxy.connect(signer).checkCollateralValueInEth()).toNumber();
    console.log(`Vault Balance in Eth: ${priceInEth}`);

    //withdraw
    await vaultProxy.withdraw("0x13512979ADE267AB5100878E2e0f485B568328a4", ethers.constants.MaxUint256);

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