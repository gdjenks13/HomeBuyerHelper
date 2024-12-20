let displayByYear = false;

document.addEventListener('DOMContentLoaded', function () {
    const scenariosDiv = document.getElementById('scenarios');
    const addScenarioButton = document.getElementById('add-scenario');
    const calculateButton = document.getElementById('calculate');
    const template = document.getElementById('scenario-template');

    let scenarioCount = 0;

    function createScenarioElement() {
        scenarioCount++;

        const clone = template.content.cloneNode(true);
        const scenarioElement = clone.querySelector('.scenario');
        
        const h3 = clone.querySelector('h3');
        h3.textContent = `Scenario ${scenarioCount}`;

        const removeButton = clone.querySelector('.remove-scenario');
        removeButton.addEventListener('click', function () {
            scenariosDiv.removeChild(scenarioElement);
            setSameHeight(document.querySelectorAll('.inputs'))
            setSameHeight(document.querySelectorAll('.results'))
        });

        const rentContainer = clone.querySelector('.rent-container');
        const removeRentButton = clone.querySelector('.remove-rent');
        const addRentButton = clone.querySelector('.add-rent');
        const toggleDisplayButton = clone.querySelector('.toggle-display');
        const toggleAmortizationButton = clone.querySelector('#toggle-amortization');
        const amortizationTableDiv = clone.querySelector('.amortizationTable');

        removeRentButton.addEventListener('click', function () {
            const rentInputs = rentContainer.querySelectorAll('input[type="number"]');
            rentInputs.forEach(input => {
                input.value = 0;
            });
        
            rentContainer.style.display = 'none';
            removeRentButton.style.display = 'none';
            addRentButton.style.display = 'inline';
            setSameHeight(document.querySelectorAll('.inputs'))
            setSameHeight(document.querySelectorAll('.results'))
        });

        addRentButton.addEventListener('click', function () {
            rentContainer.style.display = 'block';
            removeRentButton.style.display = 'inline';
            addRentButton.style.display = 'none';
            setSameHeight(document.querySelectorAll('.inputs'))
            setSameHeight(document.querySelectorAll('.results'))
        });

        toggleDisplayButton.addEventListener('click', function () {
            displayByYear = !displayByYear;
            toggleDisplayButton.textContent = displayByYear ? 'Switch to Monthly' : 'Switch to Yearly';
            calculateSingleScenario(scenarioElement);
            setSameHeight(document.querySelectorAll('.inputs'))
            setSameHeight(document.querySelectorAll('.results'))
        });

        toggleAmortizationButton.addEventListener('click', function () {
            const isHidden = amortizationTableDiv.style.display === 'none';
            amortizationTableDiv.style.display = isHidden ? 'contents' : 'none';
            toggleAmortizationButton.textContent = isHidden ? 'Hide Amortization Table' : 'Show Amortization Table';
            setSameHeight(document.querySelectorAll('.inputs'))
            setSameHeight(document.querySelectorAll('.results'))
        });

        amortizationTableDiv.style.display = 'none';

        scenariosDiv.appendChild(clone);
    }

    function setSameHeight(desiredQuery) {
        let maxHeight = 0;

        desiredQuery.forEach(input => {
            input.style.height = 'auto';
            const height = input.offsetHeight;
            maxHeight = Math.max(maxHeight, height);
        });

        desiredQuery.forEach(input => {
            input.style.height = `${maxHeight}px`;
        });
    }

    function calculateScenarios() {
        const scenarios = document.querySelectorAll('.scenario')

        scenarios.forEach(scenario => {
            calculateSingleScenario(scenario);
        });

        setSameHeight(document.querySelectorAll('.inputs'))
        setSameHeight(document.querySelectorAll('.results'))
    }

    function calculateSingleScenario(scenario)
    {
        const rentPrice = parseFloat(scenario.querySelector('.rentPrice').value);
        const rentInsurance = parseFloat(scenario.querySelector('.rentInsurance').value) / 100;
        const rentTime = parseFloat(scenario.querySelector('.rentTime').value);
        const homePurchasePrice = parseFloat(scenario.querySelector('.homePrice').value);
        const downPayment = parseFloat(scenario.querySelector('.downPayment').value);
        const monthlyInterestRate = (parseFloat(scenario.querySelector('.interestRate').value) / 100) / 12;
        const propertyTaxRate = parseFloat(scenario.querySelector('.propertyTax').value) / 100;
        const loanTerm = parseInt(scenario.querySelector('.loanTerm').value) * 12;
        const homeInsuranceRate = parseFloat(scenario.querySelector('.homeInsurance').value) / 100;
        const pmiRate = parseFloat(scenario.querySelector('.pmi').value) / 100;
        const closingCosts = parseFloat(scenario.querySelector('.closingCosts').value) / 100 * homePurchasePrice;
        const maintenanceCosts = parseFloat(scenario.querySelector('.maintenanceCosts').value) / 100
        let pmiPresentAtStart = (downPayment / homePurchasePrice) < 0.2;
        const appreciationRate = 1 + parseFloat(scenario.querySelector('.appreciation').value) / 100;

        let homeCurrentValue = homePurchasePrice;
        let loanAmount = homePurchasePrice - downPayment;
        let monthlyPayment = loanAmount
            * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm))
            / (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
        let formattedMonthlyPayment = formatValue(monthlyPayment);

        let yearlyPmi = homePurchasePrice * pmiRate;
        let yearlyPropertyTax = homePurchasePrice * propertyTaxRate;
        let yearlyHomeInsurance = homePurchasePrice * homeInsuranceRate;

        let remainingMortgage = loanAmount;
        let totalMortgageCost = 0;
        let totalHousingCost = 0;

        let amortizationTable = `<h2>${displayByYear ? 'Yearly Amortization' : 'Monthly Amortization'}</h2>
                                <table>
                                    <tr>
                                        <th>${displayByYear ? 'Year' : 'Month'}</th>
                                        <th>${displayByYear ? 'Payments' : 'Payment'}</th>
                                        ${pmiPresentAtStart ? '<th>PMI</th>' : ''}
                                        <th>Property Tax</th>
                                        <th>Insurance</th>
                                        <th>Total Cost</th>
                                        <th>Maintenance</th>
                                        <th>Remaining Balance</th>
                                        <th>Current Equity</th>
                                    </tr>`;

        if (displayByYear) {
            let adjustedYearlyPmi = yearlyPmi;
            let pmiPresentNow = pmiPresentAtStart;
            let yearlyRentPrice = rentPrice * 12;
            let yearlyRentInsurance = yearlyRentPrice * rentInsurance;
            for (rentYear = 1; rentYear <= rentTime; rentYear++)
                {
                    amortizationTable += `<tr>
                                        <td>${rentYear}</td>
                                        <td>${formatValue(yearlyRentPrice)}</td>
                                        ${pmiPresentAtStart 
                                            ? `<td></td>` : ''}
                                        <td>${formatValue(0)}</td>
                                        <td>${formatValue(yearlyRentInsurance)}</td>
                                        <td>${formatValue(yearlyRentPrice + yearlyRentInsurance)}</td>
                                        <td>${formatValue(0)}</td>
                                        <td>${formatValue(0)}</td>
                                        <td>${formatValue(0)}</td>
                                    </tr>`;
                }
            for (let year = 1; year <= loanTerm / 12; year++) {
                for (let i = 0; i < 12; i++) {
                    remainingMortgage -= monthlyPayment - remainingMortgage * monthlyInterestRate;

                    if (pmiPresentNow && adjustedYearlyPmi === yearlyPmi && (remainingMortgage / homePurchasePrice <= 0.8)) {
                        adjustedYearlyPmi = yearlyPmi * (i / 12);
                    }
                }

                let totalYearlyMortgageCost = monthlyPayment * 12 + (pmiPresentNow ? adjustedYearlyPmi : 0);
                let yearlyMaintenanceCost = maintenanceCosts * homeCurrentValue;
                let totalYearlyHousingCost = totalYearlyMortgageCost + yearlyPropertyTax + yearlyHomeInsurance + yearlyMaintenanceCost;
                

                totalMortgageCost += totalYearlyMortgageCost;
                totalHousingCost += totalYearlyHousingCost;

                amortizationTable += `<tr>
                                <td>${year + rentTime}</td>
                                <td>${formatValue(monthlyPayment * 12)}</td>
                                ${pmiPresentAtStart 
                                    ? (pmiPresentNow 
                                        ? `<td>${adjustedYearlyPmi === yearlyPmi 
                                            ? formatValue(yearlyPmi) 
                                            : formatValue(adjustedYearlyPmi)}</td>` 
                                        : `<td>${formatValue(0)}</td>`) 
                                    : ''}
                                <td>${formatValue(yearlyPropertyTax)}</td>
                                <td>${formatValue(yearlyHomeInsurance)}</td>
                                <td>${formatValue(totalYearlyHousingCost)}</td>
                                <td>${formatValue(yearlyMaintenanceCost)}</td>
                                <td>${formatValue(remainingMortgage)}</td>
                                <td>${formatValue(homeCurrentValue - remainingMortgage)}</td>
                            </tr>`;

                yearlyPropertyTax *= appreciationRate;
                yearlyHomeInsurance *= appreciationRate;
                homeCurrentValue *= appreciationRate;

                if (adjustedYearlyPmi !== yearlyPmi) {
                    pmiPresentNow = false;
                }
            }

        } else {
            let monthlyRentInsurance = rentInsurance * rentPrice;
            for (rentMonth = 1; rentMonth <= rentTime * 12; rentMonth++)
                {
                    amortizationTable += `<tr>
                                        <td>${rentMonth}</td>
                                        <td>${formatValue(rentPrice)}</td>
                                        ${pmiPresentAtStart 
                                            ? `<td></td>` : ''}
                                        <td>${formatValue(0)}</td>
                                        <td>${formatValue(monthlyRentInsurance)}</td>
                                        <td>${formatValue(rentPrice + monthlyRentInsurance)}</td>
                                        <td>${formatValue(0)}</td>
                                        <td>${formatValue(0)}</td>
                                        <td>${formatValue(0)}</td>
                                    </tr>`;
                }
            for (let month = 1; month <= loanTerm; month++) {
                let homePricePaid = monthlyPayment - remainingMortgage * monthlyInterestRate;
                remainingMortgage -= homePricePaid;
                let pmiPresentNow = remainingMortgage / homePurchasePrice > 0.8;

                let monthlyMaintenanceCost = (maintenanceCosts * homeCurrentValue) / 12;
                let totalMonthlyMortgageCost = monthlyPayment + (pmiPresentNow ? yearlyPmi / 12 : 0);
                let totalMonthlyHousingCost = totalMonthlyMortgageCost + yearlyPropertyTax / 12 + yearlyHomeInsurance / 12 + monthlyMaintenanceCost;

                totalMortgageCost += totalMonthlyMortgageCost;
                totalHousingCost += totalMonthlyHousingCost;

                amortizationTable += `<tr>
                                <td>${month + (rentTime * 12)}</td>
                                <td>${formattedMonthlyPayment}</td>
                                ${pmiPresentAtStart 
                                    ? `<td>${pmiPresentNow 
                                        ? formatValue(yearlyPmi / 12) 
                                        : formatValue(0)}</td>` 
                                    : ''}
                                <td>${formatValue(yearlyPropertyTax / 12)}</td>
                                <td>${formatValue(yearlyHomeInsurance / 12)}</td>
                                <td>${formatValue(totalMonthlyHousingCost)}</td>
                                <td>${formatValue(monthlyMaintenanceCost)}</td>
                                <td>${formatValue(remainingMortgage)}</td>
                                <td>${formatValue(homeCurrentValue - remainingMortgage)}</td>
                            </tr>`;
                if (month % 12 === 0) {
                    yearlyPropertyTax *= appreciationRate;
                    yearlyHomeInsurance *= appreciationRate;
                    homeCurrentValue *= appreciationRate;
                }
            }
        }

        amortizationTable += `</table><br>`;

        let totalRentCost = 12 * ((rentPrice + (rentInsurance * rentPrice)) * rentTime)
        let results = `<h2>Results</h2>
        <table class="results-table">
            <tr><td>Total Rent Cost:</td><td>${formatValue(totalRentCost)}</td></tr>
            <tr><td>Mortgage Payment:</td><td>${formattedMonthlyPayment}</td></tr>
            <tr><td>Closing Costs:</td><td>${formatValue(closingCosts)}</td></tr>
            <tr><td>Total Mortgage Cost:</td><td>${formatValue(totalMortgageCost + closingCosts)}</td></tr>
            <tr><td>Total Housing Cost:</td><td>${formatValue(totalHousingCost + totalRentCost + closingCosts)}</td></tr>
            <tr><td>Final Home Value:</td><td>${formatValue(homeCurrentValue)}</td></tr>
            <tr><td>Home Value - Housing Cost:</td><td><strong>${formatValue(homeCurrentValue - (totalHousingCost + totalRentCost + closingCosts))}</strong></td></tr>
        </table>`;


        scenario.querySelector('.results').innerHTML = results;
        scenario.querySelector('.amortizationTable').innerHTML = amortizationTable;
    }

    function formatValue(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    createScenarioElement();

    addScenarioButton.addEventListener('click', createScenarioElement);

    calculateButton.addEventListener('click', calculateScenarios);
});