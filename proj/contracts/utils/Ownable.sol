pragma solidity >=0.4.24 <0.7.0;

contract Ownable {

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;          // Account used to deploy contract

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(isContractOwner(), "Caller is not contract owner");
        _;
    }

    function isContractOwner() internal view returns (bool) {
        return msg.sender == contractOwner;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor() public
    {
        contractOwner = msg.sender;
    }
}