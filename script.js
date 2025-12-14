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

            // --- 1. CALCULATE SCORES ---
            let processedTeams = data.teams.map(team => {
                let totalScore = 0;
                const formattedScores = team.scores.map((score, index) => {
                    totalScore += score;
                    const isDefault = score === data.weeklyAverages[index];
                    return { val: score, isDefault: isDefault };
                });
                
                const lastRoundScore = team.scores[roundsCount - 1] || 0;
                const prevTotal = roundsCount > 1 ? totalScore - lastRoundScore : 0;

                return {
                    teamName: team.teamName,
                    scores: formattedScores,
                    total: totalScore,
                    prevTotal: prevTotal
                };
            });

            // --- 2. RANKING LOGIC ---
            processedTeams.sort((a, b) => a.total - b.total);
            processedTeams.forEach((team, index) => { team.currentRank = index + 1; });

            if (roundsCount > 1) {
                const prevStandings = [...processedTeams].sort((a, b) => a.prevTotal - b.prevTotal);
                processedTeams.forEach(team => {
                    const prevRankIndex = prevStandings.findIndex(t => t.teamName === team.teamName);
                    team.prevRank = prevRankIndex + 1;
                    team.posChange = team.prevRank - team.currentRank;
                });
            } else {
                processedTeams.forEach(team => team.posChange = 0);
            }


            // --- 3. BUILD HEADERS (New Order: Pos, Name, Total, Rounds) ---
            tableHeadRow.innerHTML = '';
            
            // 1. Pos
            const thPos = document.createElement('th');
            thPos.textContent = 'Pos';
            thPos.className = 'sticky-col col-pos';
            tableHeadRow.appendChild(thPos);

            // 2. Name
            const thName = document.createElement('th');
            thName.textContent = 'Team Name';
            thName.className = 'sticky-col col-name';
            tableHeadRow.appendChild(thName);
// 3. Total
            const thTotal = document.createElement('th');
            thTotal.textContent = 'Total';
            thTotal.className = 'col-total'; // removed 'sticky-col' here, CSS handles it
            tableHeadRow.appendChild(thTotal);

            // 4. Rounds (Scrollable)
            for (let i = 1; i <= roundsCount; i++) {
                const th = document.createElement('th');
                th.textContent = `Rnd ${i}`;
                tableHeadRow.appendChild(th);
            }
            

            // --- 4. BUILD BODY ---
            processedTeams.forEach(team => {
                const row = document.createElement('tr');

                // 1. Pos Cell
                const posCell = document.createElement('td');
                posCell.className = 'sticky-col col-pos';
                posCell.style.textAlign = 'center';
                
                if (roundsCount === 1) {
                    posCell.innerHTML = '<span style="color:#ccc">-</span>';
                } else if (team.posChange > 0) {
                    posCell.innerHTML = `<span style="color:#2ecc71; font-weight:bold;">▲ ${team.posChange}</span>`;
                } else if (team.posChange < 0) {
                    posCell.innerHTML = `<span style="color:#e74c3c; font-weight:bold;">▼ ${Math.abs(team.posChange)}</span>`;
                } else {
                    posCell.innerHTML = '<span style="color:#ccc">-</span>';
                }
                row.appendChild(posCell);

                // 2. Name Cell
                const nameCell = document.createElement('td');
                nameCell.className = 'sticky-col col-name';
                nameCell.textContent = team.teamName;
                row.appendChild(nameCell);

// 3. Total Cell
            const totalCell = document.createElement('td');
            totalCell.className = 'col-total'; // removed 'sticky-col'
            totalCell.textContent = team.total.toFixed(2);
            row.appendChild(totalCell);

                // 4. Round Scores
                team.scores.forEach(s => {
                    const td = document.createElement('td');
                    td.textContent = s.val.toFixed(2);
                    if (s.isDefault) {
                        td.classList.add('default-score');
                    }
                    row.appendChild(td);
                });

                tableBody.appendChild(row);
            });


            // --- 5. BUILD FOOTER ---
            const footerRow = document.createElement('tr');
            
            // Pos (Empty)
            const tdPos = document.createElement('td');
            tdPos.className = 'sticky-col col-pos';
            footerRow.appendChild(tdPos);

            // Name (Label)
            const tdName = document.createElement('td');
            tdName.textContent = 'Weekly Average';
            tdName.className = 'sticky-col col-name';
            footerRow.appendChild(tdName);

// Total (Empty)
            const tdTotal = document.createElement('td');
            tdTotal.className = 'col-total'; // removed 'sticky-col'
            footerRow.appendChild(tdTotal);

            // Rounds Averages
            data.weeklyAverages.forEach(avg => {
                const td = document.createElement('td');
                td.textContent = avg.toFixed(2);
                footerRow.appendChild(td);
            });
            
            tableFooter.appendChild(footerRow);


            // --- 6. CHARTS ---
            // createScoreChart(processedTeams, roundsCount); // Currently disabled
            createWeeklyScoreChart(processedTeams, data.weeklyAverages, roundsCount);

        })
        .catch(error => {
            console.error('Error:', error);
            titleElement.textContent = 'Error loading scores';
        });
});

// --- CALCULATOR LOGIC (No changes needed here, copy previous version) ---
(function setupCalculator() {
    const hcpInputs = document.querySelectorAll('.hcp-input');
    const initInputs = document.querySelectorAll('.init-input');
    const grossInput = document.getElementById('gross-input');
    const resultBox = document.getElementById('calc-results');
    const errorBox = document.getElementById('calc-error');
    const elSum = document.getElementById('calc-sum');
    const elDivisor = document.getElementById('calc-divisor');
    const elTeamHcp = document.getElementById('calc-team-hcp');
    const elFinalResult = document.getElementById('result-value');
    const divisors = { 2: 4, 3: 6, 4: 8, 5: 10 };

    function loadSavedData() {
        hcpInputs.forEach(input => { const saved = localStorage.getItem(input.id); if (saved !== null) input.value = saved; });
        initInputs.forEach(input => { const saved = localStorage.getItem(input.id); if (saved !== null) input.value = saved; });
        calculate();
    }
    function saveData(event) { localStorage.setItem(event.target.id, event.target.value); }

    function calculate() {
        let playerCount = 0; let sumHcp = 0;
        hcpInputs.forEach(input => { if (input.value !== '') { playerCount++; sumHcp += parseFloat(input.value); } });
        const grossScore = parseFloat(grossInput.value);

        if (playerCount < 2 || isNaN(grossScore)) {
            resultBox.style.display = 'none';
            if (playerCount > 0 && playerCount < 2) errorBox.style.display = 'block'; else errorBox.style.display = 'none';
            return;
        }
        errorBox.style.display = 'none'; resultBox.style.display = 'block';

        const divisor = divisors[playerCount] || 10;
        const teamHcp = sumHcp / divisor;
        const netScore = (grossScore * 2) - teamHcp;

        elSum.textContent = `Sum: ${sumHcp.toFixed(1)}`;
        elDivisor.textContent = `Div: ${divisor}`;
        elTeamHcp.textContent = `Hcp: ${teamHcp.toFixed(2)}`;
        elFinalResult.textContent = netScore.toFixed(2);
    }
    
    hcpInputs.forEach(input => { input.addEventListener('input', (e) => { saveData(e); calculate(); }); });
    initInputs.forEach(input => { input.addEventListener('input', saveData); });
    grossInput.addEventListener('input', calculate);
    loadSavedData();
})();


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

