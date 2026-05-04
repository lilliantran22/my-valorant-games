// Game state
let selectedAgent = null;
let isLockedIn = false;
let eliminatedState = new Array(ALL_AGENTS.length).fill(false);

// DOM elements
const agentSelect = document.getElementById('agentSelect');
const lockInBtn = document.getElementById('lockInBtn');
const agentsGrid = document.getElementById('agentsGridContainer');
const statsSpan = document.getElementById('statsDisplay');
const gameMessageDiv = document.getElementById('gameMessage');
const resetBtn = document.getElementById('resetGameBtn');
const agentCountBadge = document.getElementById('agentCountBadge');

function updateStats() {
    const activeCards = ALL_AGENTS.filter((_, idx) => !eliminatedState[idx]).length;
    statsSpan.innerText = `📊 Candidates left: ${activeCards} / ${ALL_AGENTS.length}`;
}

function toggleEliminate(index) {
    if (!isLockedIn) {
        gameMessageDiv.innerHTML = "⚠️ Please lock in your selected agent first!";
        return;
    }

    eliminatedState[index] = !eliminatedState[index]; // i like tacos

    const card = agentsGrid.children[index];
    const agent = ALL_AGENTS[index];

    if (eliminatedState[index]) {
        card.classList.remove('eliminated');
        void card.offsetWidth;
        card.classList.add('eliminated');
        gameMessageDiv.innerHTML = `🗑️ Eliminated: ${agent.name}. Click again to undo if needed.`;
    } else {
        card.classList.remove('eliminated');
        gameMessageDiv.innerHTML = `↩️ Restored: ${agent.name}. Back in the running!`;
    }

    updateStats();
}

function renderGrid() {
    if (!agentsGrid) return;
    agentsGrid.innerHTML = '';

    ALL_AGENTS.forEach((agent, idx) => {
        const card = document.createElement('div');
        card.className = 'agent-card';

        const imgElement = document.createElement('img');
        imgElement.src = `${IMG_BASE}${agent.image}`;
        imgElement.alt = agent.name;
        imgElement.className = 'card-img';
        imgElement.onerror = () => {
            imgElement.src = 'https://placehold.co/200x200?text=' + agent.name;
        };

        const nameSpan = document.createElement('div');
        nameSpan.className = 'agent-name';
        nameSpan.innerText = agent.name;

        card.appendChild(imgElement);
        card.appendChild(nameSpan);

        card.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEliminate(idx);
        });

        agentsGrid.appendChild(card);
    });

    updateStats();
}

function lockInAgent() {
    const selectedName = agentSelect.value;
    if (!selectedName) {
        gameMessageDiv.innerHTML = "⚠️ Please select an agent from the dropdown first!";
        return;
    }

    selectedAgent = ALL_AGENTS.find(a => a.name === selectedName);
    isLockedIn = true;
    agentSelect.disabled = true;
    lockInBtn.disabled = true;
    lockInBtn.textContent = "✓ Locked In";

    gameMessageDiv.innerHTML = `🔒 Locked in! Your selected agent is ${selectedAgent.name}. Now click cards to eliminate suspects. Click again to undo!`;
}

function resetGame() {
    selectedAgent = null;
    isLockedIn = false;
    eliminatedState = new Array(ALL_AGENTS.length).fill(false);

    agentSelect.disabled = false;
    agentSelect.value = "";
    lockInBtn.disabled = false;
    lockInBtn.textContent = "🔒 Lock In";

    renderGrid();
    gameMessageDiv.innerHTML = "🔄 Game reset! Select an agent from the dropdown and click 'Lock In' to start.";
}

function populateAgentDropdown() {
    if (!agentSelect) return;
    agentSelect.innerHTML = '<option value="">-- Choose your agent --</option>';

    ALL_AGENTS.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.name;
        option.textContent = agent.name;
        agentSelect.appendChild(option);
    });

    if (agentCountBadge) {
        agentCountBadge.textContent = `${ALL_AGENTS.length} Agents`;
    }

    renderGrid();
}

lockInBtn.addEventListener('click', lockInAgent);
resetBtn.addEventListener('click', resetGame);

populateAgentDropdown();