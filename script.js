let myWeeklyChart;

document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('main-title');
    const tableHeadRow = document.getElementById('table-headers');
    const tableBody = document.getElementById('score-body');
    const tableFooter = document.getElementById('score-footer');

    fetch('scores.json')
        .then(response => response.json())
        .then(data => {
            titleElement.textContent = data.title;
            const roundsCount = data.weeklyAverages.length;

            // --- 1. CALCULATE SCORES & TOTALS ---
            // First, verify scores against averages to flag defaults
            let processedTeams = data.teams.map(team => {
                let totalScore = 0;
                
                const formattedScores = team.scores.map((score, index) => {
                    totalScore += score;
                    const isDefault = score === data.weeklyAverages[index];
                    return { val: score, isDefault: isDefault };
                });
                
                // Calculate Previous Total (Total minus the last round)
                // If only 1 round played, prevTotal is 0
                const lastRoundScore = team.scores[roundsCount - 1] || 0;
                const prevTotal = roundsCount > 1 ? totalScore - lastRoundScore : 0;

                return {
                    teamName: team.teamName,
                    scores: formattedScores,
                    total: totalScore,
                    prevTotal: prevTotal
                };
            });

            // --- 2. CALCULATE POSITIONS ---
            // A. Determine Current Rank
            // Sort by Total (lowest is best)
            processedTeams.sort((a, b) => a.total - b.total);
            // Assign current rank (1st, 2nd, etc.)
            processedTeams.forEach((team, index) => {
                team.currentRank = index + 1;
            });

            // B. Determine Previous Rank
            if (roundsCount > 1) {
                // Create a temporary sorted list for previous totals
                const prevStandings = [...processedTeams].sort((a, b) => a.prevTotal - b.prevTotal);
                
                // Map the previous rank back to the main team objects
                processedTeams.forEach(team => {
                    // Find index in the previous standings array
                    const prevRankIndex = prevStandings.findIndex(t => t.teamName === team.teamName);
                    team.prevRank = prevRankIndex + 1;
                    
                    // Calculate Change: (Prev - Current)
                    // Ex: Was 5th, now 2nd. 5 - 2 = +3 (Moved UP 3 spots)
                    team.posChange = team.prevRank - team.currentRank;
                });
            } else {
                processedTeams.forEach(team => team.posChange = 0);
            }


            // --- 3. DYNAMICALLY BUILD HEADER ROW ---
            tableHeadRow.innerHTML = '';
            
            // NEW: Position Change Column
            const thPos = document.createElement('th');
            thPos.textContent = 'Pos';
            tableHeadRow.appendChild(thPos);

            const thTeam = document.createElement('th');
            thTeam.textContent = 'Team Name';
            tableHeadRow.appendChild(thTeam);
            
            for (let i = 1; i <= roundsCount; i++) {
                const th = document.createElement('th');
                th.textContent = `Rnd ${i}`;
                tableHeadRow.appendChild(th);
            }
            
            const thTotal = document.createElement('th');
            thTotal.textContent = 'Total';
            tableHeadRow.appendChild(thTotal);


            // --- 4. BUILD TABLE BODY ---
            processedTeams.forEach(team => {
                const row = document.createElement('tr');

                // A. Position Change Cell
                const posCell = document.createElement('td');
                posCell.style.fontWeight = "bold";
                posCell.style.fontSize = "0.9em";
                
                if (roundsCount === 1) {
                    posCell.innerHTML = '<span style="color:#ccc">-</span>';
                } else if (team.posChange > 0) {
                    // Moved UP (Green arrow)
                    posCell.innerHTML = `<span style="color:#2ecc71">▲ ${team.posChange}</span>`;
                } else if (team.posChange < 0) {
                    // Moved DOWN (Red arrow)
                    // Math.abs turns "-2" into "2"
                    posCell.innerHTML = `<span style="color:#e74c3c">▼ ${Math.abs(team.posChange)}</span>`;
                } else {
                    // No Change
                    posCell.innerHTML = '<span style="color:#ccc">-</span>';
                }
                row.appendChild(posCell);


                // B. Team Name
                const nameCell = document.createElement('td');
                nameCell.textContent = team.teamName;
                row.appendChild(nameCell);

                // C. Round Scores
                team.scores.forEach(s => {
                    const td = document.createElement('td');
                    td.textContent = s.val.toFixed(2);
                    if (s.isDefault) {
                        td.classList.add('default-score');
                    }
                    row.appendChild(td);
                });

                // D. Total
                const totalCell = document.createElement('td');
                totalCell.classList.add('total-score');
                totalCell.textContent = team.total.toFixed(2);
                row.appendChild(totalCell);

                tableBody.appendChild(row);
            });


            // --- 5. BUILD TABLE FOOTER (AVERAGES) ---
            const footerRow = document.createElement('tr');
            // Add empty cell for "Pos" column
            footerRow.innerHTML = '<td></td><td>Weekly Average</td>';
            
            data.weeklyAverages.forEach(avg => {
                const td = document.createElement('td');
                td.textContent = avg.toFixed(2);
                footerRow.appendChild(td);
            });
            footerRow.innerHTML += '<td></td>'; 
            tableFooter.appendChild(footerRow);


            // --- 6. BUILD CHARTS ---
            createScoreChart(processedTeams, roundsCount); 
            createWeeklyScoreChart(processedTeams, data.weeklyAverages, roundsCount);

        })
        .catch(error => {
            console.error('Error:', error);
            titleElement.textContent = 'Error loading scores';
        });
});

// --- CHART FUNCTIONS (Keep these exactly as they were) ---
function createScoreChart(teamsData, roundsCount) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    const labels = ['Start'];
    for(let i=1; i<=roundsCount; i++) labels.push(`Rnd ${i}`);

    const datasets = teamsData.map(team => {
        let runningTotal = 0;
        const dataPoints = [0];
        team.scores.forEach(s => { runningTotal += s.val; dataPoints.push(runningTotal); });
        const color = `rgba(${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, 0.8)`;
        return {
            label: team.teamName, data: dataPoints, borderColor: color, backgroundColor: color, fill: false, tension: 0.1
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            plugins: { legend: { display: teamsData.length <= 30, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }, tooltip: { mode: 'index', intersect: false } },
            scales: { y: { title: { display: true, text: 'Cumulative Score' } }, x: { title: { display: true, text: 'Rounds' } } }
        }
    });
}

function createWeeklyScoreChart(teamsData, weeklyAverages, roundsCount) {
    const ctx = document.getElementById('weeklyScoreChart').getContext('2d');
    const toggleContainer = document.getElementById('team-toggle-container');
    toggleContainer.innerHTML = '';
    const labels = [];
    for(let i=1; i<=roundsCount; i++) labels.push(`Rnd ${i}`);
    const allDatasets = [];

    teamsData.forEach((team, index) => {
        const color = `rgba(${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, 0.8)`;
        const teamDataset = {
            label: team.teamName, data: team.scores.map(s => s.val), borderColor: color, backgroundColor: color, fill: false, tension: 0.1, hidden: index >= 3
        };
        allDatasets.push(teamDataset);

        const toggleDiv = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.id = team.teamName; checkbox.checked = index < 3;
        const label = document.createElement('label');
        label.htmlFor = team.teamName; label.textContent = team.teamName;
        toggleDiv.appendChild(checkbox); toggleDiv.appendChild(label); toggleContainer.appendChild(toggleDiv);
        checkbox.addEventListener('change', () => {
            const dataset = myWeeklyChart.data.datasets.find(d => d.label === team.teamName);
            if (dataset) { dataset.hidden = !checkbox.checked; myWeeklyChart.update(); }
        });
    });

    allDatasets.push({ label: 'Weekly Average', data: weeklyAverages, borderColor: '#e63946', backgroundColor: '#e63946', borderDash: [5, 5], tension: 0.1 });

    myWeeklyChart = new Chart(ctx, {
        type: 'line', data: { labels: labels, datasets: allDatasets },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: { y: { title: { display: true, text: 'Score per Round' } } } }
    });
}

// --- CALCULATOR LOGIC ---
// This runs immediately to set up the event listeners
(function setupCalculator() {
    const hcpInputs = document.querySelectorAll('.hcp-input');
    const grossInput = document.getElementById('gross-input');
    
    const resultBox = document.getElementById('calc-results');
    const errorBox = document.getElementById('calc-error');
    
    const elSum = document.getElementById('calc-sum');
    const elDivisor = document.getElementById('calc-divisor');
    const elTeamHcp = document.getElementById('calc-team-hcp');
    const elFinalResult = document.getElementById('result-value');

    // The rules for the divisor based on player count
    const divisors = {
        2: 4,
        3: 6,
        4: 8,
        5: 10
    };

    function calculate() {
        let playerCount = 0;
        let sumHcp = 0;

        // 1. Process Handicaps
        hcpInputs.forEach(input => {
            // Check if value is strictly not an empty string
            if (input.value !== '') {
                playerCount++;
                sumHcp += parseFloat(input.value);
            }
        });

        // 2. Get Gross Score
        const grossScore = parseFloat(grossInput.value);

        // 3. Validate
        // We need at least 2 players and a valid gross score to show a result
        if (playerCount < 2 || isNaN(grossScore)) {
            resultBox.style.display = 'none';
            if (playerCount > 0 && playerCount < 2) {
                errorBox.style.display = 'block'; // Show hint if they only typed 1 player
            } else {
                errorBox.style.display = 'none';
            }
            return;
        }

        errorBox.style.display = 'none';
        resultBox.style.display = 'block';

        // 4. Calculate Team Handicap
        // If more than 5 players, default to 10 (or handle error), but UI limits to 5.
        const divisor = divisors[playerCount] || 10; 
        const teamHcp = sumHcp / divisor;

        // 5. Calculate Final Net Score
        // Formula: (Gross * 2) - Team Hcp
        const netScore = (grossScore * 2) - teamHcp;

        // 6. Update UI
        elSum.textContent = `Sum: ${sumHcp.toFixed(1)}`;
        elDivisor.textContent = `Div: ${divisor}`;
        elTeamHcp.textContent = `Hcp: ${teamHcp.toFixed(2)}`;
        elFinalResult.textContent = netScore.toFixed(2);
    }

    // Add event listeners to all inputs to trigger calculation on change
    hcpInputs.forEach(input => input.addEventListener('input', calculate));
    grossInput.addEventListener('input', calculate);
})();
