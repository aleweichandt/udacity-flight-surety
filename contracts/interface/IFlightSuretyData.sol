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
    function registerAirline(address airline) external;

    function getAirlinesCount() external view returns (uint256);

    function isAirline(address airline) external view returns(bool);

    /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function getAirlineFunds(address airline) external view returns(uint256);

    function fundAirline(address airline) external payable;

    /**
    * @dev Add a flight to the registry
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerFlight(
        address airline, bytes32 flight, uint8 statusCode
    ) external;

    function isFlight(bytes32 flight) external view returns (bool);

    function getFlightStatus(bytes32 flight) external view returns (uint8);

    function updateFlightStatus(bytes32 flight, uint8 status) external;

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy(address client, bytes32 flight) external payable;

    function getInsurance(address client, bytes32 flight) external view returns (uint256);

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flight, uint256 multiplier) external;

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address client, uint256 amount) external;

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() external payable;
}

