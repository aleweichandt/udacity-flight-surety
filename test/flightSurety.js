
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

    // ACT
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: 1});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.getAirlineFunds.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, 1, "Airline hasn't provided funding");

  });

  it('(airline) can not register an Airline using registerAirline() if has not enough funds', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: 5});
    } catch(e) { }
    // ACT
    try {
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
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: 10});
    } catch(e) { }

    // ACT
    try {
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

    // ACT
    try {
        //fund airline to be able to vote
        await config.flightSuretyApp.fund({from: thirdAirline, value: 10});
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

    // ACT
    try {
        //fund airline to be able to vote
        await config.flightSuretyApp.fund({from: fourthAirline, value: 10});
        // already has 2 votes
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: fourthAirline});
    } catch(e) {}
    let isFifthRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);

    // ASSERT
    assert.equal(isFifthRegistered, true, "Fifth airline should be registered after consensus");

  });
 

});
