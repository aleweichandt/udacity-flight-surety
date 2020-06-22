
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        function getAirline() {
            const index = parseInt(DOM.elid('airline-number').value);
            return contract.airlines[index];
        }
        function getFlight() {
            const index = parseInt(DOM.elid('flight-number').value);
            return contract.flights[index];
        }
        function getPassenger() {
            const index = parseInt(DOM.elid('passenger-number').value);
            return contract.passengers[index];
        }

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            const flight = getFlight();
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.name + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid('register-airline').addEventListener('click', () => {
            const airline = getAirline()
            const index = parseInt(DOM.elid('target-airline-number').value);
            const newAirline = contract.airlines[index];
            // Write transaction
            contract.registerAirline(airline, newAirline, (error, result) => {
                display('Airlines', 'Register', [ { label: 'Register Airline', error: error, value: result } ]);
            });
        });

        DOM.elid('fund-airline').addEventListener('click', () => {
            const airline = getAirline();
            const amount = DOM.elid('airline-funds').value;
            // Write transaction
            contract.fundAirline(airline, amount, (error, result) => {
                display('Airlines', 'Fund', [ { label: 'Fund Airline', error: error, value: result + " ETH"} ]);
            });
        });

        DOM.elid('register-flight').addEventListener('click', () => {
            const flight = getFlight();
            // Write transaction
            contract.registerFlight(flight, (error, result) => {
                display('Flights', 'Register', [ { label: 'Register Flight', error: error, value: result } ]);
            });
        });

        DOM.elid('buy-insurance').addEventListener('click', () => {
            const passenger = getPassenger();
            const flight = getFlight();
            const amount = DOM.elid('insurance-funds').value;
            // Write transaction
            contract.buyInsurance(passenger, flight, amount, (error, result) => {
                display('Passengers', 'Insurance', [ { label: 'Buy insurance', error: error, value: result } ]);
            });
        });

        DOM.elid('get-insurance').addEventListener('click', () => {
            const passenger = getPassenger();
            const flight = getFlight();
            // Write transaction
            contract.getFlightInsurance(passenger, flight, (error, result) => {
                display('Passengers', 'Insurance', [ { label: 'Get insurance', error: error, value: result + " ETH" } ]);
            });
        });

        DOM.elid('get-funds').addEventListener('click', () => {
            const passenger = getPassenger();
            const amount = DOM.elid('passenger-funds').value;
            // Write transaction
            contract.withdrawFunds(passenger, amount, (error, result) => {
                display('Passengers', 'Funds', [ { label: 'Withdraw funds', error: error, value: result } ]);
            });
        });
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







