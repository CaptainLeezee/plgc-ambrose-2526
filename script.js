// --- NEW: Declare a global variable for our weekly chart ---
// This allows the checkbox event listeners to access and update the chart.
let myWeeklyChart;

// Wait for the HTML page to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Select the elements where we will inject data
    const titleElement = document.getElementById('main-title');
    const tableBody = document.getElementById('score-body');
    const tableFooter = document.getElementById('score-footer');

    // Fetch the score data from our JSON file
    fetch('scores.json')
        .then(response => response.json())
        .then(data => {
            
            titleElement.textContent = data.title;
            const sortedTeams = data.teams.sort((a, b) => a.total - b.total);

            // --- 1. Build the Table ---
            sortedTeams.forEach(team => {
                if (team.total === 0) return;
                const row = document.createElement('tr');

                let r1_score = team.rnd1.score.toFixed(2);
                let r1_class = team.rnd1.isDefault ? 'class="default-score"' : '';
                
                let r2_score = team.rnd2.score.toFixed(2);
                let r2_class = team.rnd2.isDefault ? 'class="default-score"' : '';

                let r3_score = team.rnd3.score.toFixed(2);
                let r3_class = team.rnd3.isDefault ? 'class="default-score"' : '';

                let r4_score = team.rnd4.score.toFixed(2);
                let r4_class = team.rnd4.isDefault ? 'class="default-score"' : '';
                
                let total = team.total.toFixed(2);
                
                row.innerHTML = `
                    <td>${team.teamName}</td>
                    <td ${r1_class}>${r1_score}</td>
                    <td ${r2_class}>${r2_score}</td>
                    <td ${r3_class}>${r3_score}</td>
                    <td ${r4_class}>${r4_score}</td>
                    <td class="total-score">${total}</td>
                `;
                tableBody.appendChild(row);
            });

            // Build the table footer
            const avg = data.weeklyAverage;
            const averageRow = document.createElement('tr');
            averageRow.innerHTML = `
                <td>Weekly Average</td>
                <td>${avg.rnd1.toFixed(2)}</td>
                <td>${avg.rnd2.toFixed(2)}</td>
                <td>${avg.rnd3.toFixed(2)}</td>
                <td>${avg.rnd4.toFixed(2)}</td>
                <td></td> 
            `;
            tableFooter.appendChild(averageRow);

            // --- 2. Create the Cumulative Chart (Chart 1) ---
            createScoreChart(sortedTeams); 

            // --- 3. Create the Weekly Score Chart (Chart 2) ---
            createWeeklyScoreChart(sortedTeams, data.weeklyAverage);

        })
        .catch(error => {
            console.error('Error fetching score data:', error);
            titleElement.textContent = 'Error loading scores';
        });
});

/**
 * Chart 1: Cumulative Scores (Existing Function)
 * Creates a line chart of cumulative scores over time.
 */
function createScoreChart(teamsData) {
    const ctx = document.getElementById('scoreChart').getContext('2d');

    const datasets = teamsData
        .filter(team => team.total > 0)
        .map(team => {
            const r1_total = team.rnd1.score;
            const r2_total = r1_total + team.rnd2.score;
            const r3_total = r2_total + team.rnd3.score;
            const r4_total = r3_total + team.rnd4.score;
            const color = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.8)`;

            return {
                label: team.teamName,
                data: [0, r1_total, r2_total, r3_total, r4_total], 
                borderColor: color,
                backgroundColor: color,
                fill: false,
                tension: 0.1 
            };
        });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start', 'Rnd 1', 'Rnd 2', 'Rnd 3', 'Rnd 4'],
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: teamsData.length <= 30, // Hide legend if too many teams
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10 } }
                },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { title: { display: true, text: 'Cumulative Score (Lowest is Best)' } },
                x: { title: { display: true, text: 'Rounds Completed' } }
            }
        }
    });
}


/**
 * --- NEW FUNCTION FOR CHART 2 ---
 * Creates a line chart of weekly scores with toggleable checkboxes.
 */
function createWeeklyScoreChart(teamsData, weeklyAverage) {
    const ctx = document.getElementById('weeklyScoreChart').getContext('2d');
    const toggleContainer = document.getElementById('team-toggle-container');
    
    // Clear any existing checkboxes
    toggleContainer.innerHTML = '';

    const allDatasets = [];

    // --- 1. Create a dataset for each team ---
    teamsData
        .filter(team => team.total > 0)
        .forEach((team, index) => {
            const color = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.8)`;
            
            // This is the per-round data, NOT cumulative
            const teamDataset = {
                label: team.teamName,
                data: [
                    team.rnd1.score,
                    team.rnd2.score,
                    team.rnd3.score,
                    team.rnd4.score
                ],
                borderColor: color,
                backgroundColor: color,
                fill: false,
                tension: 0.1,
                hidden: index >=3 // Initially visible
            };
            allDatasets.push(teamDataset);

            // --- 2. Create a checkbox for this team ---
            const toggleDiv = document.createElement('div');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = index < 3;
            checkbox.id = team.teamName; // Link checkbox to dataset label
            
            const label = document.createElement('label');
            label.htmlFor = team.teamName;
            label.textContent = team.teamName;
            
            toggleDiv.appendChild(checkbox);
            toggleDiv.appendChild(label);
            toggleContainer.appendChild(toggleDiv);

            // --- 3. Add event listener to the checkbox ---
            checkbox.addEventListener('change', () => {
                // Find the dataset in the chart
                const dataset = myWeeklyChart.data.datasets.find(d => d.label === team.teamName);
                if (dataset) {
                    dataset.hidden = !checkbox.checked; // Hide or show it
                    myWeeklyChart.update(); // Redraw the chart
                }
            });
        });

    // --- 4. Add the "Weekly Average" dataset ---
    allDatasets.push({
        label: 'Weekly Average',
        data: [
            weeklyAverage.rnd1,
            weeklyAverage.rnd2,
            weeklyAverage.rnd3,
            weeklyAverage.rnd4
        ],
        borderColor: '#e63946', // A strong red color
        backgroundColor: '#e63946',
        fill: false,
        borderDash: [5, 5], // Make it a dashed line
        tension: 0.1
    });

    // --- 5. Create the chart instance ---
    // We assign it to the global variable
    myWeeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Rnd 1', 'Rnd 2', 'Rnd 3', 'Rnd 4'], // X-axis labels
            datasets: allDatasets
        },
        options: {
            responsive: true,
            plugins: {
                // IMPORTANT: Hide the default legend
                legend: {
                    display: false 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Score per Round (Lowest is Best)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Round'
                    }
                }
            }
        }
    });
}


