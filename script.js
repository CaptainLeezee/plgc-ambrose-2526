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
            
            // Set the main title from the JSON
            titleElement.textContent = data.title;

            // Sort teams by total score, lowest to highest
            const sortedTeams = data.teams.sort((a, b) => a.total - b.total);

            // Loop through each team and build the table row
            sortedTeams.forEach(team => {
                // Skip teams with 0 total (like "BALLZ DEEP IN THE ROUGH" in the data)
                if (team.total === 0) return;

                const row = document.createElement('tr');

                // Get scores and default flags, and format them
                let r1_score = team.rnd1.score.toFixed(2);
                let r1_class = team.rnd1.isDefault ? 'class="default-score"' : '';

                let r2_score = team.rnd2.score.toFixed(2);
                let r2_class = team.rnd2.isDefault ? 'class="default-score"' : '';
                
                let total = team.total.toFixed(2);
                
                // Build the row HTML, applying classes only to the cells
                row.innerHTML = `
                    <td>${team.teamName}</td>
                    <td ${r1_class}>${r1_score}</td>
                    <td ${r2_class}>${r2_score}</td>
                    <td class="total-score">${total}</td>
                `;
                
                tableBody.appendChild(row);
            });

            // Add the Weekly Average row to the footer
            const avg = data.weeklyAverage;
            const averageRow = document.createElement('tr');
            averageRow.innerHTML = `
                <td>Weekly Average</td>
                <td>${avg.rnd1.toFixed(2)}</td>
                <td>${avg.rnd2.toFixed(2)}</td>
                <td></td> 
            `;
            tableFooter.appendChild(averageRow);

        })
        .catch(error => {
            console.error('Error fetching score data:', error);
            titleElement.textContent = 'Error loading scores';
        });
});
