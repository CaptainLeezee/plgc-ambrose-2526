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
                
                // Add a class if it's a default score
                if (team.isDefault) {
                    row.classList.add('default-score');
                }

                // Format numbers to 2 decimal places
                let r1 = team.rnd1.toFixed(2);
                let r2 = team.rnd2.toFixed(2);
                let total = team.total.toFixed(2);

                row.innerHTML = `
                    <td>${team.teamName}</td>
                    <td>${r1}</td>
                    <td>${r2}</td>
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