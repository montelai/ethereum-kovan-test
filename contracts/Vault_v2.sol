pragma solidity 0.6.12;

import "./Vault.sol";

//new function to show that the contract logic has been updated

contract VaultV2 is Vault {
    function checkVersion() override public  pure returns (uint256 version) {
        return 888888; 
    }
    
}