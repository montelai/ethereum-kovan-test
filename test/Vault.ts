import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

//Using hardhat upgrades, it already implements Upgradable EIP1967Proxy from openzeppelin.


describe("Proxy Vault", function() {

  let owner: SignerWithAddress;
  let Vault: ContractFactory;

  beforeEach(async() => {
    owner = (await ethers.getSigners())[0];
    console.log(`Owner Account: ${owner.address}`);

    Vault = await ethers.getContractFactory("Vault");
  })

  it("Deployment should deploy proxy contract and set Vault as the implementation and run initializable", async() => {
    //deploy proxy 
    const vaultProxy: Contract = await upgrades.deployProxy(Vault, [], {initializer: "initializable"});
    await vaultProxy.deployed();
    console.log(`Proxy Deployed to: ${vaultProxy.address}`);

    const attached: Contract = Vault.attach(vaultProxy.address);
    //get implementation address
    // this is the value from bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)
    const storage = ethers.BigNumber.from("0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
    const logicAddr = ethers.utils.hexStripZeros(await ethers.provider.getStorageAt(vaultProxy.address, storage));
    console.log(`Logic at: ${logicAddr}`);

    //check state of proxy if _usdt was initialized
    const usdtAddr: string = await attached._usdt();
    expect(usdtAddr).to.equal("0x13512979ADE267AB5100878E2e0f485B568328a4");
    const versionNumber: number = (await attached.checkVersion()).toNumber();
    expect(versionNumber).to.equal(99);
  });

  it("Should upgrade to vault2 implementation with the same proxy address", async () => {
    //deploy proxy 
    const vaultProxy: Contract = await upgrades.deployProxy(Vault, [], {initializer: "initializable"});
    await vaultProxy.deployed();
    console.log(`Proxy Deployed to: ${vaultProxy.address}`);

    let storage = ethers.BigNumber.from("0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
    const logicAddr1 = ethers.utils.hexStripZeros(await ethers.provider.getStorageAt(vaultProxy.address, storage));
    console.log(`V1 Logic at: ${logicAddr1}`);
    //perform upgrade
    const VaultV2 = await ethers.getContractFactory("VaultV2");
    const vaultProxyV2: Contract = await upgrades.upgradeProxy(vaultProxy.address, VaultV2);
    const attached: Contract = VaultV2.attach(vaultProxyV2.address);

    //make sure the proxy addresses are the same as before
    expect(vaultProxy.address).to.equal(vaultProxyV2.address);

    storage = ethers.BigNumber.from("0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
    const logicAddr2 = ethers.utils.hexStripZeros(await ethers.provider.getStorageAt(vaultProxy.address, storage));
    console.log(`V2 Logic at: ${logicAddr2}`);
    
    //make sure logic address have changed
    expect(logicAddr1).to.not.equal(logicAddr2);

    //sanity check and see if the new function is returned
    const versionNumber: number = (await attached.checkVersion()).toNumber();
    expect(versionNumber).to.equal(888888);
  })
});
