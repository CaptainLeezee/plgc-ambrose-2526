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

            // Build the table
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

            // --- NEW: Call the function to create the chart ---
            // We pass 'sortedTeams' so the chart legend can match the table order
            createScoreChart(sortedTeams); 

        })
        .catch(error => {
            console.error('Error fetching score data:', error);
            titleElement.textContent = 'Error loading scores';
        });
});

/**
 * --- NEW FUNCTION ---
 * Creates a line chart of cumulative scores over time.
 * @param {Array} teamsData - The array of team data from scores.json.
 */
function createScoreChart(teamsData) {
    const ctx = document.getElementById('scoreChart').getContext('2d');

    // 1. Prepare the data for the chart
    const datasets = teamsData
        .filter(team => team.total > 0) // Exclude teams with 0 score
        .map(team => {
            // Calculate cumulative scores
            const r1_total = team.rnd1.score;
            const r2_total = r1_total + team.rnd2.score;
            const r3_total = r2_total + team.rnd3.score;
            const r4_total = r3_total + team.rnd4.score; // This is the final total

            // Generate a random color for this team's line
            const color = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.8)`;

            return {
                label: team.teamName,
                // Start at 0, then add each round's cumulative total
                data: [0, r1_total, r2_total, r3_total, r4_total], 
                borderColor: color,
                backgroundColor: color, // For the legend dot
                fill: false,
                tension: 0.1 // Makes the lines slightly curved
            };
        });

    // 2. Create the chart instance
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start', 'Rnd 1', 'Rnd 2', 'Rnd 3', 'Rnd 4'], // X-axis labels
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    // Hides some legend items if there are too many
                    // (optional, but good for usability)
                    display: teamsData.length <= 30, 
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    // Shows all teams on hover
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cumulative Score (Lowest is Best)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Rounds Completed'
                    }
                }
            }
        }
    });
}
