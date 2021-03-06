pragma solidity >=0.4.24 <0.7.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./utils/Ownable.sol";
import "./utils/Operational.sol";
import "./interface/IFlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is Ownable, Operational {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Airline Management
    uint8 private constant MIN_AIRLINES_REGISTERED = 4;
    uint256 private constant MIN_AIRLINE_FUNDS = 10 ether;

    uint256 private INSURANCE_MULTIPLIER = 1;

    struct QueuedAddress {
        mapping(address => bool) votes; // who voted
        uint256 votesCount; // votes
    }
    mapping(address => QueuedAddress) private queuedAirlines;

    // Data contract
    IFlightSuretyData private datasource;

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier cashBack(uint256 value)
    {
        _;
        uint256 rest = msg.value.sub(value);
        msg.sender.transfer(rest);
    }

    modifier registeredAirline()
    {
        require(datasource.isAirline(msg.sender), "Forbidden Access");
        _;
    }

    modifier fundedAirline()
    {
        require(datasource.getAirlineFunds(msg.sender) >= MIN_AIRLINE_FUNDS, "Forbidden Access, please register and fund");
        _;
    }

    modifier openFlight(address airline, string memory flight, uint256 timestamp)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(datasource.getFlightStatus(key) == STATUS_CODE_UNKNOWN, "Flight has been closed");
        _;
    }

    modifier closedFlight(address airline, string memory flight, uint256 timestamp)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(datasource.getFlightStatus(key) != STATUS_CODE_UNKNOWN, "Flight is still open");
        _;
    }


    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address dataAddress) Ownable() public
    {
        // Register into datasource
        datasource = IFlightSuretyData(dataAddress);
        INSURANCE_MULTIPLIER = INSURANCE_MULTIPLIER.mul(3).div(2);
    }

    /********************************************************************************************/
    /*                                     UTILITY CONTRACT FUNCTIONS                           */
    /********************************************************************************************/


    function getFlightKey(
        address airline, string memory flight, uint256 timestamp
    ) internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /********************************************************************************************/
    /*                                     AIRLINES                                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline(address airline) public requireIsOperational fundedAirline returns(bool success, uint256 votes)
    {
        require(!datasource.isAirline(airline), "airline already registered");
        require(!queuedAirlines[airline].votes[msg.sender], "Already voted");

        queuedAirlines[airline].votes[msg.sender] = true;
        queuedAirlines[airline].votesCount = queuedAirlines[airline].votesCount.add(1);

        votes = queuedAirlines[airline].votesCount;
        success = hasEnoughVotes(airline);
        if(success) {
            datasource.registerAirline(airline);
        }
        return (success, 0);
    }

    function hasEnoughVotes(address airline) internal view returns (bool)
    {
        uint256 count = datasource.getAirlinesCount();
        return count < MIN_AIRLINES_REGISTERED || count < queuedAirlines[airline].votesCount.mul(2);
    }

   /**
    * @dev Add funds to an airline.
    *
    */
    function fund() external payable requireIsOperational registeredAirline
    {
        datasource.fundAirline.value(msg.value)(msg.sender);
    }

    /********************************************************************************************/
    /*                                     FLIGHTS                                             */
    /********************************************************************************************/

   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight(
        string flight, uint256 timestamp
    ) external requireIsOperational fundedAirline returns (bytes32)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flight, timestamp);
        datasource.registerFlight(msg.sender, flightKey, STATUS_CODE_UNKNOWN);
        return flightKey;
    }

    function hasRegisteredFlight(string flight, uint256 timestamp) external view returns (bool)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flight, timestamp);
        return datasource.isFlight(flightKey);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus(
        address airline, string memory flight, uint256 timestamp, uint8 statusCode
    ) internal openFlight(airline, flight, timestamp)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        datasource.updateFlightStatus(flightKey, statusCode);

        if(statusCode == STATUS_CODE_LATE_AIRLINE) {
            datasource.creditInsurees(flightKey, INSURANCE_MULTIPLIER);
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline, string flight, uint256 timestamp
    ) external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    /********************************************************************************************/
    /*                                     PASSENGERS                                           */
    /********************************************************************************************/

    function buyInsurance(
        address airline, string flight, uint256 timestamp
    ) external payable requireIsOperational openFlight(airline, flight, timestamp) cashBack(1 ether)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(datasource.getInsurance(msg.sender, flightKey) == 0, "Insurance already applied");
        uint256 value = msg.value;
        if(value > 1 ether) {
            value = 1 ether;
        }
        datasource.buy.value(value)(msg.sender, flightKey);
    }

    function getInsurance(
        address airline, string flight, uint256 timestamp
    ) external view returns (uint256) {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        return datasource.getInsurance(msg.sender, flightKey);
    }

    function withdrawFunds(uint256 amount) external requireIsOperational
    {
        datasource.pay(msg.sender, amount);
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() external payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes() external view returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index, address airline, string flight, uint256 timestamp, uint8 statusCode
    ) external
    {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
            (oracles[msg.sender].indexes[1] == index) ||
            (oracles[msg.sender].indexes[2] == index),
             "Index does not match oracle request"
        );


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}
