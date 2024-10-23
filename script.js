let displayByYear = false;
let tableVisible = true;

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
        });

        const rentContainer = clone.querySelector('.rent-container');
        const toggleRentButton = clone.querySelector('.toggle-rent');
        const addRentButton = clone.querySelector('.add-rent');
        const toggleDisplayButton = clone.querySelector('.toggle-display');
        const toggleAmortizationButton = clone.querySelector('#toggle-amortization');
        const amortizationTableDiv = clone.querySelector('.amortizationTable');

        toggleRentButton.addEventListener('click', function () {
            const rentInputs = rentContainer.querySelectorAll('input[type="number"]');
            rentInputs.forEach(input => {
                input.value = 0;
            });
        
            rentContainer.style.display = 'none';
            toggleRentButton.style.display = 'none';
            addRentButton.style.display = 'inline';
        });

        addRentButton.addEventListener('click', function () {
            rentContainer.style.display = 'block';
            toggleRentButton.style.display = 'inline';
            addRentButton.style.display = 'none';
        });

        toggleDisplayButton.addEventListener('click', function () {
            displayByYear = !displayByYear;
            toggleDisplayButton.textContent = displayByYear ? 'Switch to Monthly' : 'Switch to Yearly';
            calculateSingleScenario(scenarioElement);
        });

        toggleAmortizationButton.addEventListener('click', function () {
            const isHidden = amortizationTableDiv.style.display === 'none';
            amortizationTableDiv.style.display = isHidden ? 'block' : 'none';
            toggleAmortizationButton.textContent = isHidden ? 'Hide Amortization Table' : 'Show Amortization Table';
        });

        amortizationTableDiv.style.display = 'none';

        scenariosDiv.appendChild(clone);
    }

    function calculateScenarios() {
        const scenarios = document.querySelectorAll('.scenario')

        scenarios.forEach(scenario => {
            calculateSingleScenario(scenario);
        });
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
                                        <th>${displayByYear ? 'Mortgage Payments' : 'Mortgage Payment'}</th>
                                        ${pmiPresentAtStart ? '<th>PMI</th>' : ''}
                                        <th>Property Tax</th>
                                        <th>Home Insurance</th>
                                        <th>Total Cost</th>
                                        <th>Remaining Balance</th>
                                        <th>Current Equity</th>
                                    </tr>`;

        if (displayByYear) {
            let adjustedYearlyPmi = yearlyPmi;
            let pmiPresentNow = pmiPresentAtStart;
            for (let year = 1; year <= loanTerm / 12; year++) {
                for (let i = 0; i < 12; i++) {
                    remainingMortgage -= monthlyPayment - remainingMortgage * monthlyInterestRate;

                    if (pmiPresentNow && adjustedYearlyPmi === yearlyPmi && (remainingMortgage / homePurchasePrice <= 0.8)) {
                        adjustedYearlyPmi = yearlyPmi * (i / 12);
                    }
                }

                let totalYearlyMortgageCost = monthlyPayment * 12 + (pmiPresentNow ? adjustedYearlyPmi : 0);
                let totalYearlyHousingCost = totalYearlyMortgageCost + yearlyPropertyTax + yearlyHomeInsurance;

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
            for (let month = 1; month <= loanTerm; month++) {
                let homePricePaid = monthlyPayment - remainingMortgage * monthlyInterestRate;
                remainingMortgage -= homePricePaid;
                let pmiPresentNow = remainingMortgage / homePurchasePrice > 0.8;

                let totalMonthlyMortgageCost = monthlyPayment + (pmiPresentNow ? yearlyPmi / 12 : 0);
                let totalMonthlyHousingCost = totalMonthlyMortgageCost + yearlyPropertyTax / 12 + yearlyHomeInsurance / 12;

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
            ${totalRentCost === 0 ? '' : `<tr><td>Total Rent Cost:</td><td>${formatValue(totalRentCost)}</td></tr>`}
            <tr><td>Mortgage Payment:</td><td>${formattedMonthlyPayment}</td></tr>
            <tr><td>Total Mortgage Cost:</td><td>${formatValue(totalMortgageCost)}</td></tr>
            <tr><td>Total Housing Cost:</td><td>${formatValue(totalHousingCost + totalRentCost)}</td></tr>
            <tr><td>Final Home Value:</td><td>${formatValue(homeCurrentValue)}</td></tr>
        </table>`;


        scenario.querySelector('.results').innerHTML = results;
        scenario.querySelector('.amortizationTable').innerHTML = amortizationTable;

        let table = scenario.querySelector('.amortizationTable');
        if (!tableVisible) {
            table.style.display = 'none';
        }
    }

    function formatValue(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    createScenarioElement();

    addScenarioButton.addEventListener('click', createScenarioElement);

    calculateButton.addEventListener('click', calculateScenarios);
});