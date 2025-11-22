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

            // --- 1. DYNAMICALLY BUILD HEADER ROW ---
            // Clear existing headers first
            tableHeadRow.innerHTML = '<th>Team Name</th>';
            
            // Create a header for each round found in the JSON
            for (let i = 1; i <= roundsCount; i++) {
                const th = document.createElement('th');
                th.textContent = `Rnd ${i}`;
                tableHeadRow.appendChild(th);
            }
            // Add Total header
            const thTotal = document.createElement('th');
            thTotal.textContent = 'Total';
            tableHeadRow.appendChild(thTotal);


            // --- 2. CALCULATE TOTALS & PREPARE DATA ---
            // We verify the scores against averages to determine "default" status
            const processedTeams = data.teams.map(team => {
                let totalScore = 0;
                const formattedScores = team.scores.map((score, index) => {
                    totalScore += score;
                    // It is a default score if it matches the weekly average exactly
                    const isDefault = score === data.weeklyAverages[index];
                    return { val: score, isDefault: isDefault };
                });
                
                return {
                    teamName: team.teamName,
                    scores: formattedScores,
                    total: totalScore
                };
            });

            // Sort by Total Score
            processedTeams.sort((a, b) => a.total - b.total);


            // --- 3. BUILD TABLE BODY ---
            processedTeams.forEach(team => {
                const row = document.createElement('tr');
                
                // Team Name
                const nameCell = document.createElement('td');
                nameCell.textContent = team.teamName;
                row.appendChild(nameCell);

                // Round Scores
                team.scores.forEach(s => {
                    const td = document.createElement('td');
                    td.textContent = s.val.toFixed(2);
                    if (s.isDefault) {
                        td.classList.add('default-score');
                    }
                    row.appendChild(td);
                });

                // Total
                const totalCell = document.createElement('td');
                totalCell.classList.add('total-score');
                totalCell.textContent = team.total.toFixed(2);
                row.appendChild(totalCell);

                tableBody.appendChild(row);
            });


            // --- 4. BUILD TABLE FOOTER (AVERAGES) ---
            const footerRow = document.createElement('tr');
            footerRow.innerHTML = '<td>Weekly Average</td>';
            data.weeklyAverages.forEach(avg => {
                const td = document.createElement('td');
                td.textContent = avg.toFixed(2);
                footerRow.appendChild(td);
            });
            footerRow.innerHTML += '<td></td>'; // Empty cell for Total column
            tableFooter.appendChild(footerRow);


            // --- 5. BUILD CHARTS ---
            createScoreChart(processedTeams, roundsCount); 
            createWeeklyScoreChart(processedTeams, data.weeklyAverages, roundsCount);

        })
        .catch(error => {
            console.error('Error:', error);
            titleElement.textContent = 'Error loading scores';
        });
});

// --- CHART 1: CUMULATIVE ---
function createScoreChart(teamsData, roundsCount) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    // Generate Labels (Rnd 1, Rnd 2...)
    const labels = ['Start'];
    for(let i=1; i<=roundsCount; i++) labels.push(`Rnd ${i}`);

    const datasets = teamsData.map(team => {
        let runningTotal = 0;
        const dataPoints = [0]; // Start at 0
        
        team.scores.forEach(s => {
            runningTotal += s.val;
            dataPoints.push(runningTotal);
        });

        const color = `rgba(${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, 0.8)`;
        return {
            label: team.teamName,
            data: dataPoints,
            borderColor: color,
            backgroundColor: color,
            fill: false,
            tension: 0.1
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { display: teamsData.length <= 30, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { title: { display: true, text: 'Cumulative Score' } },
                x: { title: { display: true, text: 'Rounds' } }
            }
        }
    });
}

// --- CHART 2: WEEKLY ---
function createWeeklyScoreChart(teamsData, weeklyAverages, roundsCount) {
    const ctx = document.getElementById('weeklyScoreChart').getContext('2d');
    const toggleContainer = document.getElementById('team-toggle-container');
    toggleContainer.innerHTML = '';

    const labels = [];
    for(let i=1; i<=roundsCount; i++) labels.push(`Rnd ${i}`);

    const allDatasets = [];

    // Teams
    teamsData.forEach((team, index) => {
        const color = `rgba(${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, ${Math.floor(Math.random()*200)}, 0.8)`;
        
        const teamDataset = {
            label: team.teamName,
            data: team.scores.map(s => s.val),
            borderColor: color,
            backgroundColor: color,
            fill: false,
            tension: 0.1,
            hidden: index >= 3 // Only show Top 3 by default
        };
        allDatasets.push(teamDataset);

        // Create Checkbox
        const toggleDiv = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = team.teamName;
        checkbox.checked = index < 3; // Check Top 3 by default
        
        const label = document.createElement('label');
        label.htmlFor = team.teamName;
        label.textContent = team.teamName;
        
        toggleDiv.appendChild(checkbox);
        toggleDiv.appendChild(label);
        toggleContainer.appendChild(toggleDiv);

        checkbox.addEventListener('change', () => {
            const dataset = myWeeklyChart.data.datasets.find(d => d.label === team.teamName);
            if (dataset) {
                dataset.hidden = !checkbox.checked;
                myWeeklyChart.update();
            }
        });
    });

    // Average Line
    allDatasets.push({
        label: 'Weekly Average',
        data: weeklyAverages,
        borderColor: '#e63946',
        backgroundColor: '#e63946',
        borderDash: [5, 5],
        tension: 0.1
    });

    myWeeklyChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: allDatasets },
        options: {
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                y: { title: { display: true, text: 'Score per Round' } }
            }
        }
    });
}
