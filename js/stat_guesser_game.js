// ============================================
// STAT GUESSER - Main Game Logic
// ============================================

const YEARS    = ['2021', '2022', '2023', '2024', '2025'];
const ALL_STATS = ['ACS', 'KD', 'ADR', 'KAST', 'HS'];
const ALL_INFO  = ['Player', 'Team', 'Match Type', 'Year'];

let pool          = [];
let usedIndices   = new Set();
let currentRow    = null;
let score         = 0;
let streak        = 0;
let highestStreak = 0;
let answered      = false;
let mapRevealed   = false;
let mapRevealedByUser = false;
let lastTenDetails = [];

let activeYears = new Set(YEARS);
let activeStats = new Set(ALL_STATS);
let activeInfo  = new Set(ALL_INFO);

// DOM refs — assigned in DOMContentLoaded
let gameArea, loadingMsg, scoreDisplay, streakDisplay, revealMapBtn;

// ============================================
// DATA LOADING
// ============================================

async function loadData() {
    const allRows = [];
    for (const yr of YEARS) {
        try {
            const res  = await fetch(`../../data/vct_${yr}/stat_guesser_with_options.json`);
            const rows = await res.json();
            allRows.push(...rows);
            console.log(`Loaded VCT ${yr}: ${rows.length} rows`);
        } catch {
            try {
                const res  = await fetch(`../../data/vct_${yr}/stat_guesser.json`);
                const rows = await res.json();
                allRows.push(...rows);
                console.log(`Loaded VCT ${yr} (fallback): ${rows.length} rows`);
            } catch {
                console.error(`Could not load VCT ${yr}`);
            }
        }
    }
    pool = allRows;
    console.log(`Total rows: ${pool.length}`);
    loadingMsg.style.display = 'none';
    // Start first question directly — bypass nextQuestion's answered guard
    currentRow = pickRow();
    if (currentRow) renderQuestion();
    else gameArea.innerHTML = '<div class="sg-loading">No data found.</div>';
}

// ============================================
// POOL / ROW HELPERS
// ============================================

function getFilteredPool() {
    return pool.filter(row =>
        activeYears.has(String(row.Year)) &&
        row['Average Combat Score'] &&
        row['Agents']
    );
}

function pickRow() {
    const filtered = getFilteredPool();
    if (!filtered.length) return null;
    const available = filtered.filter(row => !usedIndices.has(pool.indexOf(row)));
    if (!available.length) {
        usedIndices.clear();
        return filtered[Math.floor(Math.random() * filtered.length)];
    }
    const row = available[Math.floor(Math.random() * available.length)];
    usedIndices.add(pool.indexOf(row));
    return row;
}

function buildOptions(row) {
    if (row.intelligent_options?.length >= 4)
        return [...row.intelligent_options].sort(() => Math.random() - 0.5);
    const allAgents = [...new Set(pool.map(r => r['Agents']).filter(Boolean))];
    const wrong = allAgents.filter(a => a !== row['Agents']).sort(() => Math.random() - 0.5).slice(0, 4);
    return [...wrong, row['Agents']].sort(() => Math.random() - 0.5);
}

function formatStat(row, stat) {
    switch (stat) {
        case 'ACS':  return row['Average Combat Score'] != null ? Math.round(row['Average Combat Score']) : '—';
        case 'KD':   return row['Kills:Deaths'] != null ? Number(row['Kills:Deaths']).toFixed(2) : '—';
        case 'ADR':  return row['Average Damage Per Round'] != null ? Math.round(row['Average Damage Per Round']) : '—';
        case 'KAST': return row['Kill, Assist, Trade, Survive %'] || '—';
        case 'HS':   return row['Headshot %'] || '—';
        default:     return '—';
    }
}

// ============================================
// MAP BANNER
// ============================================

function displayMapBanner(mapName) {
    document.getElementById('sgMapBanner')?.remove();
    const imgUrl = getMapImageUrl(mapName);
    const banner = document.createElement('div');
    banner.id = 'sgMapBanner';
    banner.className = 'sg-map-banner-container';
    banner.innerHTML = imgUrl
        ? `<div class="sg-map-banner">
               <img src="${imgUrl}" alt="${mapName}"
                    onerror="this.style.display='none';this.parentElement.innerHTML='🗺 Map: ${mapName}'">
           </div>`
        : `<div class="sg-map-banner sg-map-banner-text">🗺 Map: ${mapName}</div>`;
    document.querySelector('.sg-settings-bar').insertAdjacentElement('afterend', banner);
}

function removeMapBanner() {
    document.getElementById('sgMapBanner')?.remove();
}

function revealMap(userInitiated = true) {
    if (!currentRow || mapRevealed) return;
    mapRevealed = true;
    if (userInitiated) mapRevealedByUser = true;
    displayMapBanner(currentRow['Map']);
    if (revealMapBtn) {
        revealMapBtn.disabled = true;
        revealMapBtn.classList.add('disabled');
        revealMapBtn.textContent = '🗺 Map Revealed';
    }
}

// ============================================
// REVEAL HIDDEN STATS & INFO AFTER ANSWER
// ============================================

function revealHidden() {
    const row = currentRow;

    // Reveal hidden stat pills — clear any placeholder message, then append hidden stats
    const statsGrid = document.querySelector('.sg-stats-grid');
    if (statsGrid) {
        // Remove the "no stats visible" placeholder if present
        const placeholder = statsGrid.querySelector('[style*="span 5"]');
        if (placeholder) placeholder.remove();
        const allStatDefs = [
            { key: 'ACS',  label: 'ACS' },
            { key: 'KD',   label: 'K/D' },
            { key: 'ADR',  label: 'ADR' },
            { key: 'KAST', label: 'KAST' },
            { key: 'HS',   label: 'HS%' },
        ];
        allStatDefs.forEach(s => {
            if (!activeStats.has(s.key)) {
                const pill = document.createElement('div');
                pill.className = 'sg-stat-pill sg-reveal-anim';
                pill.innerHTML = `<div class="sg-stat-name">${s.label}</div>
                                  <div class="sg-stat-value">${formatStat(row, s.key)}</div>`;
                statsGrid.appendChild(pill);
            }
        });
        // Fix grid columns to show all 5
        statsGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    }

    // Reveal hidden player info in the header
    const playerNameEl = document.querySelector('.sg-player-name');
    const playerMetaEl = document.querySelector('.sg-player-meta');

    if (playerNameEl && !activeInfo.has('Player')) {
        playerNameEl.textContent = row['Player'] || 'Unknown';
        playerNameEl.classList.add('sg-reveal-anim');
    }

    if (playerMetaEl) {
        // Build full meta with all info, highlight newly revealed ones
        const parts = [];
        if (!activeInfo.has('Team') && row['Teams'])
            parts.push(`<span class="sg-reveal-anim" style="color:#ff8a8f;font-weight:600;">${row['Teams']}</span>`);
        else if (activeInfo.has('Team') && row['Teams'])
            parts.push(`<span style="color:#ff8a8f;font-weight:600;">${row['Teams']}</span>`);

        if (!activeInfo.has('Match Type') && row['Match Type'])
            parts.push(`<span class="sg-reveal-anim">${row['Match Type']}</span>`);
        else if (activeInfo.has('Match Type') && row['Match Type'])
            parts.push(row['Match Type']);

        if (!activeInfo.has('Year') && row['Year'])
            parts.push(`<span class="sg-reveal-anim">VCT ${row['Year']}</span>`);
        else if (activeInfo.has('Year') && row['Year'])
            parts.push(`VCT ${row['Year']}`);

        playerMetaEl.innerHTML = parts.join(' · ');
    }
}

// ============================================
// SCORE / UI HELPERS
// ============================================

function updateScoreUI() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
}

function showPanelWarning(panelId, message) {
    const panel = document.getElementById(panelId);
    let warning = panel.querySelector('.sg-panel-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.className = 'sg-panel-warning';
        panel.appendChild(warning);
    }
    warning.textContent = message;
}

function showTempError(panelId, message) {
    const panel = document.getElementById(panelId);
    let err = panel.querySelector('.sg-panel-error');
    if (!err) {
        err = document.createElement('div');
        err.className = 'sg-panel-error';
        panel.appendChild(err);
    }
    err.textContent = message;
    clearTimeout(err._timer);
    err._timer = setTimeout(() => err.remove(), 3000);
}

function removePanelWarning(panelId) {
    document.getElementById(panelId)?.querySelector('.sg-panel-warning')?.remove();
}

function addToLastTen(correct, userRevealedMap) {
    // push to end so first guess = index 0 = first emoji when we reverse
    lastTenDetails.push({ correct, mapRevealedByUser: userRevealedMap });
    if (lastTenDetails.length > 10) lastTenDetails.shift();
}

// ============================================
// PANELS
// ============================================

function togglePanel(panelId) {
    const panel  = document.getElementById(panelId);
    const isOpen = panel.classList.contains('open');
    closeAllPanels();
    if (!isOpen) {
        panel.classList.add('open');
        if (score > 0 || streak > 0)
            showPanelWarning(panelId, '⚠️ Changing settings will reset score & streak!');
    }
}

function closeAllPanels() {
    document.querySelectorAll('.sg-settings-panel').forEach(p => {
        p.classList.remove('open');
        removePanelWarning(p.id);
    });
}

// ============================================
// APPLY SETTINGS
// ============================================

function applyFilters() {
    const newYears = new Set(
        [...document.querySelectorAll('.sg-year-pill.active')]
            .map(p => p.dataset.year).filter(y => y !== 'all')
    );
    if (!newYears.size) {
        showTempError('filterPanel', '❌ Select at least one year before saving.');
        return;
    }
    activeYears = newYears;
    closeAllPanels();
    resetGame(true);
}

function applyCustomizations() {
    const newStats = new Set(
        [...document.querySelectorAll('.sg-stat-toggle.active')].map(t => t.dataset.stat)
    );
    const newInfo = new Set(
        [...document.querySelectorAll('.sg-info-toggle.active')].map(t => t.dataset.info)
    );
    if (!newStats.size && !newInfo.size) {
        showTempError('customizePanel', '❌ Select at least one option before saving.');
        return;
    }
    activeStats = newStats;
    activeInfo  = newInfo;
    closeAllPanels();
    resetGame(true);
}

// ============================================
// GAME FLOW
// ============================================

function resetGame(fullReset = true) {
    answered          = false;
    mapRevealed       = false;
    mapRevealedByUser = false;
    removeMapBanner();

    if (revealMapBtn) {
        revealMapBtn.disabled = false;
        revealMapBtn.classList.remove('disabled');
        revealMapBtn.textContent = '🗺 Reveal Map';
    }

    if (fullReset) {
        score          = 0;
        streak         = 0;
        highestStreak  = 0;
        lastTenDetails = [];
        usedIndices.clear();
        updateScoreUI();

        // Sync pill/toggle UI to current active sets
        document.querySelectorAll('.sg-year-pill').forEach(p =>
            p.classList.toggle('active',
                p.dataset.year === 'all'
                    ? activeYears.size === YEARS.length
                    : activeYears.has(p.dataset.year)
            )
        );
        document.querySelectorAll('.sg-stat-toggle').forEach(t =>
            t.classList.toggle('active', activeStats.has(t.dataset.stat))
        );
        document.querySelectorAll('.sg-info-toggle').forEach(t =>
            t.classList.toggle('active', activeInfo.has(t.dataset.info))
        );
    }

    currentRow = pickRow();
    if (!currentRow) {
        gameArea.innerHTML = '<div class="sg-loading">No data found for selected filters.</div>';
        return;
    }
    renderQuestion();
}

function nextQuestion() {
    if (!answered) return; // must guess before advancing
    answered          = false;
    mapRevealed       = false;
    mapRevealedByUser = false;
    removeMapBanner();

    if (revealMapBtn) {
        revealMapBtn.disabled = false;
        revealMapBtn.classList.remove('disabled');
        revealMapBtn.textContent = '🗺 Reveal Map';
    }

    currentRow = pickRow();
    if (!currentRow) {
        gameArea.innerHTML = '<div class="sg-loading">No data found for selected filters.</div>';
        return;
    }
    renderQuestion();
}

function renderQuestion() {
    if (!currentRow) return;

    const options = buildOptions(currentRow);

    // Meta line — only active info fields shown during play
    const metaParts = [];
    if (activeInfo.has('Team'))       metaParts.push(`<span>${currentRow['Teams'] || ''}</span>`);
    if (activeInfo.has('Match Type')) metaParts.push(currentRow['Match Type'] || '');
    if (activeInfo.has('Year'))       metaParts.push(`VCT ${currentRow['Year'] || ''}`);

    // Only active stats shown during play
    const statDefs = [
        { key: 'ACS',  label: 'ACS'  },
        { key: 'KD',   label: 'K/D'  },
        { key: 'ADR',  label: 'ADR'  },
        { key: 'KAST', label: 'KAST' },
        { key: 'HS',   label: 'HS%'  },
    ].filter(s => activeStats.has(s.key));

    const statsHTML = statDefs.length
        ? statDefs.map(s => `
            <div class="sg-stat-pill">
                <div class="sg-stat-name">${s.label}</div>
                <div class="sg-stat-value">${formatStat(currentRow, s.key)}</div>
            </div>`).join('')
        : `<div class="sg-stat-pill" style="grid-column:span 5;text-align:center;color:#7a8fa6;">
               No stats visible — enable some in Customize Visibility.
           </div>`;

    const agentBtnsHTML = options.map(agent => {
        const agentData = ALL_AGENTS.find(a => a.name === agent);
        const imgSrc = agentData ? `${IMG_BASE}${agentData.image}` : '';
        return `<button class="sg-agent-btn" onclick="handleAnswer(this)" data-agent="${agent}">
                    <img src="${imgSrc}" alt="${agent}" onerror="this.style.display='none'">
                    ${agent}
                </button>`;
    }).join('');

    const playerName = activeInfo.has('Player') ? (currentRow['Player'] || 'Unknown') : '???';

    gameArea.innerHTML = `
        <div class="sg-stat-card">
            <div class="sg-stat-card-header">
                <div class="sg-player-info">
                    <div class="sg-player-name">${playerName}</div>
                    <div class="sg-player-meta">${metaParts.join(' · ')}</div>
                </div>
                <div class="sg-question-badge">Which agent?</div>
            </div>
            <div class="sg-stats-grid">${statsHTML}</div>
        </div>

        <p class="sg-prompt">Which agent was <strong>${playerName}</strong> playing?</p>

        <div class="sg-agent-grid" id="agentGrid">${agentBtnsHTML}</div>

        <div class="sg-feedback" id="feedback"></div>

        <div class="sg-button-group">
            <button class="sg-share-btn" id="shareBtn">📤 Share Results</button>
            <button class="sg-next-btn" id="nextBtn" disabled>Next →</button>
        </div>
    `;

    document.getElementById('shareBtn').addEventListener('click', shareResults);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
}

function handleAnswer(btn) {
    if (answered) return;
    answered = true;

    const chosen       = btn.dataset.agent;
    const correct      = currentRow['Agents'];
    const userRevealed = mapRevealedByUser;

    // Auto-reveal map on answer
    if (!mapRevealed) revealMap(false);

    // Mark agent buttons
    document.querySelectorAll('.sg-agent-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.agent === correct)
            b.classList.add(chosen === correct ? 'correct' : 'reveal');
        else if (b.dataset.agent === chosen)
            b.classList.add('wrong');
    });

    const isCorrect = chosen === correct;

    if (isCorrect) {
        score++;
        streak++;
        if (streak > highestStreak) highestStreak = streak;
        document.getElementById('feedback').textContent = `✓ Correct! ${correct} on ${currentRow['Match Type']}.`;
        document.getElementById('feedback').className = 'sg-feedback correct';
    } else {
        streak = 0;
        document.getElementById('feedback').textContent = `✗ It was ${correct}. Better luck next time.`;
        document.getElementById('feedback').className = 'sg-feedback wrong';
    }

    // Reveal all hidden stats and info
    revealHidden();

    addToLastTen(isCorrect, userRevealed);
    updateScoreUI();

    document.getElementById('nextBtn').disabled = false;
}

// ============================================
// SHARE
// ============================================

function shareResults() {
    const yearLabel = activeYears.size === YEARS.length    ? 'All Years' : [...activeYears].sort().join(', ');
    const statLabel = activeStats.size === ALL_STATS.length ? 'All Stats'  : [...activeStats].join(', ');
    const infoLabel = activeInfo.size  === ALL_INFO.length  ? 'All Info'   : [...activeInfo].join(', ');

    // lastTenDetails is oldest→newest (push to end), so index 0 = first guess = first emoji
    const emojiLine = lastTenDetails
        .map(d => d.mapRevealedByUser ? (d.correct ? '💡🟩' : '💡🟥') : (d.correct ? '🟩' : '🟥'))
        .join('');

    const shareText =
        `Stat Guesser\n` +
        `Years: ${yearLabel} | Stats: ${statLabel} | Info: ${infoLabel}\n` +
        `${emojiLine}\n` +
        `Score: ${score} | Best Streak: ${highestStreak}\n` +
        `Play at: https://lilliantran22.github.io/my-valorant-games/pages/stat-guesser/index.html`;

    navigator.clipboard.writeText(shareText).then(() => {
        const feedback = document.getElementById('feedback');
        if (feedback) {
            const prev = { text: feedback.textContent, cls: feedback.className };
            feedback.textContent = '📋 Copied to clipboard!';
            feedback.className = 'sg-feedback correct';
            setTimeout(() => {
                feedback.textContent = prev.text;
                feedback.className   = prev.cls;
            }, 2000);
        }
    }).catch(() => alert('Could not copy automatically.\n\n' + shareText));
}

// ============================================
// EVENT LISTENERS & INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    gameArea      = document.getElementById('gameArea');
    loadingMsg    = document.getElementById('loadingMsg');
    scoreDisplay  = document.getElementById('scoreDisplay');
    streakDisplay = document.getElementById('streakDisplay');
    revealMapBtn  = document.getElementById('revealMapBtn');

    // Panel toggles
    document.getElementById('filterBtn').addEventListener('click',    () => togglePanel('filterPanel'));
    document.getElementById('customizeBtn').addEventListener('click', () => togglePanel('customizePanel'));

    // Close panels on outside click
    document.addEventListener('click', e => {
        if (!e.target.closest('.sg-settings-panel') &&
            !e.target.closest('#filterBtn') &&
            !e.target.closest('#customizeBtn'))
            closeAllPanels();
    });

    // New Game — reset everything to defaults
    document.getElementById('newGameBtn').addEventListener('click', () => {
        activeYears = new Set(YEARS);
        activeStats = new Set(ALL_STATS);
        activeInfo  = new Set(ALL_INFO);
        closeAllPanels();
        resetGame(true);
    });

    // Reveal Map
    revealMapBtn.addEventListener('click', () => revealMap(true));

    // ── Filter Panel ──
    document.getElementById('yearPills').addEventListener('click', e => {
        const pill = e.target.closest('.sg-year-pill');
        if (!pill) return;
        if (pill.dataset.year === 'all') {
            // Toggle All: if currently on → deselect All only (years unchanged)
            //             if currently off → select All + all years
            const allOn = pill.classList.contains('active');
            if (allOn) {
                pill.classList.remove('active');
            } else {
                document.querySelectorAll('.sg-year-pill').forEach(p => p.classList.add('active'));
            }
        } else {
            // Toggle individual year; if All was on, deselect All too
            pill.classList.toggle('active');
            document.querySelector('.sg-year-pill[data-year="all"]').classList.remove('active');
            // Re-add All if all individual years are now active
            const allOn = [...document.querySelectorAll('.sg-year-pill[data-year!="all"]')]
                            .every(p => p.classList.contains('active'));
            document.querySelector('.sg-year-pill[data-year="all"]').classList.toggle('active', allOn);
        }
    });

    document.getElementById('filterDefaultBtn').addEventListener('click', () => {
        document.querySelectorAll('.sg-year-pill').forEach(p => p.classList.add('active'));
    });

    document.getElementById('filterDeselectBtn').addEventListener('click', () => {
        document.querySelectorAll('.sg-year-pill').forEach(p => p.classList.remove('active'));
    });

    document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);

    // ── Customize Panel ──
    document.getElementById('allToggles').addEventListener('click', e => {
        const toggle = e.target.closest('.sg-stat-toggle, .sg-info-toggle');
        if (!toggle) return;
        toggle.classList.toggle('active');
    });

    document.getElementById('customizeDefaultBtn').addEventListener('click', () => {
        document.querySelectorAll('.sg-stat-toggle').forEach(t =>
            t.classList.toggle('active', ALL_STATS.includes(t.dataset.stat))
        );
        document.querySelectorAll('.sg-info-toggle').forEach(t =>
            t.classList.toggle('active', ALL_INFO.includes(t.dataset.info))
        );
    });

    document.getElementById('customizeDeselectBtn').addEventListener('click', () => {
        document.querySelectorAll('.sg-stat-toggle, .sg-info-toggle').forEach(t =>
            t.classList.remove('active')
        );
    });

    document.getElementById('applyCustomizeBtn').addEventListener('click', applyCustomizations);

    loadData();
});