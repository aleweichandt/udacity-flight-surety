
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) can be funded using fund()', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    const funds = web3.utils.toWei("1", "ether");

    // ACT
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: funds});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.getAirlineFunds.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, funds, "Airline hasn't provided funding");

  });

  it('(airline) can not register an Airline using registerAirline() if has not enough funds', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    const funds = web3.utils.toWei("5", "ether");

    // ACT
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: funds});
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided enough funding");

  });

  it('(airline) can register an Airline using registerAirline() if it is funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    const funds = web3.utils.toWei("10", "ether");

    // ACT
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: funds});
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    } catch(e) { }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if has enough funds");

  });

  it('(airline) cannot register 5th airline without consensus', async () => {
    
    // ARRANGE
    let thirdAirline = accounts[3];
    let fourthAirline = accounts[4];
    let fifthAirline = accounts[5];
    try {
        await config.flightSuretyApp.registerAirline(thirdAirline, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(fourthAirline, {from: config.firstAirline});
    } catch(e) { }

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: config.firstAirline});
    } catch(e) { }
    let isThirdRegistered = await config.flightSuretyData.isAirline.call(thirdAirline);
    let isFourthRegistered = await config.flightSuretyData.isAirline.call(fourthAirline);
    let isFifthRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);

    // ASSERT
    assert.equal(isThirdRegistered, true, "Third airline should be registered without consensus");
    assert.equal(isFourthRegistered, true, "Fourth airline should be registered without consensus");
    assert.equal(isFifthRegistered, false, "Fifth airline should not be registered without consensus");

  });

  it('(airline) cannot register 5th airline without consensus', async () => {
    
    // ARRANGE
    let thirdAirline = accounts[3];
    let fourthAirline = accounts[4];
    let fifthAirline = accounts[5];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(thirdAirline, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(fourthAirline, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: config.firstAirline});
    } catch(e) { }
    let isThirdRegistered = await config.flightSuretyData.isAirline.call(thirdAirline);
    let isFourthRegistered = await config.flightSuretyData.isAirline.call(fourthAirline);
    let isFifthRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);

    // ASSERT
    assert.equal(isThirdRegistered, true, "Third airline should be registered without consensus");
    assert.equal(isFourthRegistered, true, "Fourth airline should be registered without consensus");
    assert.equal(isFifthRegistered, false, "Fifth airline should not be registered without consensus");

  });

  it('(airline) cannot vote more than once', async () => {
    
    // ARRANGE
    let thirdAirline = accounts[3];
    let fifthAirline = accounts[5];
    const funds = web3.utils.toWei("10", "ether");

    // ACT
    try {
        //fund airline to be able to vote
        await config.flightSuretyApp.fund({from: thirdAirline, value: funds});
        // requires 2 more votes
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: thirdAirline});
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: thirdAirline});
    } catch(e) { }
    let isFifthRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);

    // ASSERT
    assert.equal(isFifthRegistered, false, "airline cannot vote more than once");

  });

  it('(airline) can register 5th airline with consensus', async () => {
    
    // ARRANGE
    let fourthAirline = accounts[4];
    let fifthAirline = accounts[5];
    const funds = web3.utils.toWei("10", "ether");

    // ACT
    try {
        //fund airline to be able to vote
        await config.flightSuretyApp.fund({from: fourthAirline, value: funds});
        // already has 2 votes
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: fourthAirline});
    } catch(e) {}
    let isFifthRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);

    // ASSERT
    assert.equal(isFifthRegistered, true, "Fifth airline should be registered after consensus");

  });

  it('(passenger) can register flight', async () => {
    
    // ARRANGE
    const timestamp = config.flightTs;
    const flight = config.flightName;

    // ACT
    try {
        await config.flightSuretyApp.registerFlight(flight, timestamp, {from: config.firstAirline});
    } catch(e) {}
    const flightRegistered = await config.flightSuretyApp.hasRegisteredFlight.call(flight, timestamp, {from:config.firstAirline});

    // ASSERT
    assert.equal(flightRegistered, true, "Flight should be registered");

  });

  it('(passenger) can not register flight if not funded', async () => {
    
    // ARRANGE
    const fifthAirline = accounts[5];
    const timestamp = Math.floor(Date.now() / 1000);
    const flight = "test2";

    // ACT
    try {
        await config.flightSuretyApp.registerFlight(flight, timestamp, {from: fifthAirline});
    } catch(e) {}
    const flightRegistered = await config.flightSuretyApp.hasRegisteredFlight.call(flight, timestamp, {from: fifthAirline});

    // ASSERT
    assert.equal(flightRegistered, false, "Not funded airline should not register flight");

  });

  it('(passenger) can buy insurance for a registered flight up to 1 ether', async () => {
    
    // ARRANGE
    const { flightTs: timestamp, flightName: flight, firstAirline: airline, client } = config;
    const funds = web3.utils.toWei("2", "ether");
    const expected = web3.utils.toWei("1", "ether");

    // ACT
    try {
        await config.flightSuretyApp.buyInsurance(airline, flight, timestamp, {from: client, value: funds});
    } catch(e) {}
    const insurance = await config.flightSuretyApp.getInsurance.call(airline, flight, timestamp, {from: client});

    // ASSERT
    assert.equal(insurance, expected, "User should buy insurance as expected");

  });

  it('(passenger) can not buy same insurance for a registered flight', async () => {
    
    // ARRANGE
    const { flightTs: timestamp, flightName: flight, firstAirline: airline, client } = config;
    const funds = web3.utils.toWei("1", "ether");

    // ACT
    try {
        // user already has max ether funded
        await config.flightSuretyApp.buyInsurance(airline, flight, timestamp, {from: client, value: funds});
    } catch(e) {}
    const insurance = await config.flightSuretyApp.getInsurance.call(airline, flight, timestamp, {from: client});

    // ASSERT
    assert.equal(insurance, funds, "User should not be allowed to add more 1 ether");

  });

  it('(passenger) can not withdraw funds if none available for him', async () => {
    
    // ARRANGE
    const { client } = config;
    const funds = web3.utils.toWei("1", "ether");

    // ACT
    let exception = null;
    try {
        // user already has max ether funded
        await config.flightSuretyApp.withdrawFunds(funds, {from: client});
    } catch(e) {
        exception = e.message;
    }

    // ASSERT
    assert.notEqual(exception, null, "User should not be allowed to withdraw funds");

  });
 

});
