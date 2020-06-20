pragma solidity >=0.4.24 <0.7.0;

interface IFlightSuretyData {

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address airline) external returns(bool success, uint256 votes);


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy() external payable;

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure;

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external pure;

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() external payable;
}

