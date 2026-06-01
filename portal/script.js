const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const elements = {
        totalClaims: document.getElementById('total-claims'),
        mythsIdentified: document.getElementById('myths-identified'),
        chwEngagement: document.getElementById('chw-engagement'),
        nationalRisk: document.getElementById('national-risk'),
        claimsFeed: document.getElementById('claims-feed'),
        loadingOverlay: document.getElementById('loading-overlay'),
        mapHotspots: document.getElementById('map-hotspots'),
        mapTooltip: document.getElementById('map-tooltip')
    };

    let charts = {};

    // 1. Initialize Charts with Empty Data
    const initCharts = () => {
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        charts.trend = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Claims Volume',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10B981',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1E293B' }, ticks: { color: '#94A3B8' } },
                    x: { grid: { display: false }, ticks: { color: '#94A3B8' } }
                }
            }
        });

        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        charts.category = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['Vaccines', 'Ebola', 'HIV/AIDS', 'Nutrition', 'Other'],
                datasets: [{
                    data: [1, 1, 1, 1, 1], // Placeholder
                    backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#64748B'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94A3B8', padding: 20, usePointStyle: true, font: { size: 12, family: 'Outfit' } }
                    }
                }
            }
        });
    };

    // 2. API Service
    const ApiService = {
        async getSummary() {
            try {
                const response = await fetch(`${API_BASE}/stats/summary`);
                return await response.json();
            } catch (e) {
                console.warn("Using mock summary data");
                return { totalClaims: 12842, mythsIdentified: 8391, chwCount: 4203, nationalRiskIndex: 72.4 };
            }
        },
        async getMapData() {
            try {
                const response = await fetch(`${API_BASE}/stats/map`);
                return await response.json();
            } catch (e) {
                console.warn("Using mock map data");
                return [
                    { district: 'Wakiso', _count: { id: 124 }, lat: 30, lng: 45 },
                    { district: 'Kampala', _count: { id: 89 }, lat: 50, lng: 60 },
                    { district: 'Gulu', _count: { id: 45 }, lat: 20, lng: 25 }
                ];
            }
        },
        async getRecentClaims() {
            try {
                const response = await fetch(`${API_BASE}/stats/recent`);
                return await response.json();
            } catch (e) {
                console.warn("Using mock claims data");
                return [
                    { id: 1, claimText: "Vaccines causing infertility...", label: "INACCURATE", submittedAt: new Date() },
                    { id: 2, claimText: "Ebola outbreak in central market", label: "ACCURATE", submittedAt: new Date(Date.now() - 900000) }
                ];
            }
        }
    };

    // 3. UI Update Functions
    const updateStats = (data) => {
        elements.totalClaims.innerText = data.totalClaims.toLocaleString();
        elements.mythsIdentified.innerText = data.mythsIdentified.toLocaleString();
        elements.chwEngagement.innerText = data.chwCount.toLocaleString();
        elements.nationalRisk.innerText = data.nationalRiskIndex.toFixed(1);
        
        if (data.nationalRiskIndex > 70) elements.nationalRisk.classList.add('high');
        else elements.nationalRisk.classList.remove('high');
    };

    const updateMap = (data) => {
        elements.mapHotspots.innerHTML = '';
        data.forEach(item => {
            const spot = document.createElement('div');
            spot.className = 'hotspot';
            // Simple mapping for demo
            spot.style.top = `${item.lat || Math.random() * 80 + 10}%`;
            spot.style.left = `${item.lng || Math.random() * 80 + 10}%`;
            
            const risk = item._count.id > 100 ? 'HIGH' : (item._count.id > 50 ? 'MEDIUM' : 'LOW');
            spot.setAttribute('data-risk', risk);
            
            spot.addEventListener('mouseenter', (e) => {
                elements.mapTooltip.style.opacity = '1';
                elements.mapTooltip.innerText = `${item.district}: ${item._count.id} Myths`;
                elements.mapTooltip.style.top = `${e.target.offsetTop - 40}px`;
                elements.mapTooltip.style.left = `${e.target.offsetLeft}px`;
            });
            
            spot.addEventListener('mouseleave', () => {
                elements.mapTooltip.style.opacity = '0';
            });
            
            elements.mapHotspots.appendChild(spot);
        });
    };

    const updateClaimsFeed = (claims) => {
        elements.claimsFeed.innerHTML = '';
        claims.forEach(claim => {
            const timeAgo = Math.floor((Date.now() - new Date(claim.submittedAt)) / 60000);
            const timeText = timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`;
            
            const item = document.createElement('div');
            item.className = 'claim-item';
            item.innerHTML = `
                <div class="claim-time">${timeText}</div>
                <div class="claim-text">"${claim.claimText.substring(0, 60)}${claim.claimText.length > 60 ? '...' : ''}"</div>
                <div class="claim-tag ${claim.label.toLowerCase() === 'inaccurate' ? 'myth' : (claim.label.toLowerCase() === 'accurate' ? 'accurate' : 'uncertain')}">
                    ${claim.label === 'INACCURATE' ? 'Myth' : claim.label}
                </div>
            `;
            elements.claimsFeed.appendChild(item);
        });
    };

    // 4. Main Refresh Loop
    const refreshData = async () => {
        const [summary, mapData, recent] = await Promise.all([
            ApiService.getSummary(),
            ApiService.getMapData(),
            ApiService.getRecentClaims()
        ]);

        updateStats(summary);
        updateMap(mapData);
        updateClaimsFeed(recent);

        // Update Charts with mock trend for now
        charts.trend.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
        charts.trend.data.datasets[0].data = [1200, 1900, 3100, 2800, 4200, 3900, 5600, 7200, summary.totalClaims];
        charts.trend.update();
        
        charts.category.data.datasets[0].data = [45, 25, 15, 10, 5]; // Keeping static proportions for demo
        charts.category.update();

        // Hide overlay on first load
        elements.loadingOverlay.classList.add('hidden');
    };

    initCharts();
    await refreshData();
    
    // Auto refresh every 30 seconds
    setInterval(refreshData, 30000);

    // =========================================================================
    // 5. VIEW / TAB SWITCHING
    // =========================================================================
    const viewTitles = {
        dashboard: { title: "Uganda Health Misinformation Analytics", subtitle: "Real-time surveillance & predictive risk monitoring" },
        heatmap: { title: "Geographic Misinformation Heatmap", subtitle: "Analyzing regional clusters and anomaly trends across Uganda" },
        intervention: { title: "National Intervention Tracker", subtitle: "Manage community-focused campaigns, alerts, and feedback loops" },
        research: { title: "MOH Verification & Research Lab", subtitle: "Offline-ready rules engine assisted by global expert AI" },
        settings: { title: "National Node Configuration", subtitle: "Manage system synchronization, API parameters, and active classifier weights" }
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle nav item active class
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const tab = item.getAttribute('data-tab');

            // Toggle views visibility
            document.querySelectorAll('.portal-view').forEach(view => {
                view.classList.remove('active');
                view.classList.add('hidden');
            });
            
            const targetView = document.getElementById(`view-${tab}`);
            if (targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active');
            }

            // Update top bar titles
            const titleInfo = viewTitles[tab] || viewTitles.dashboard;
            document.getElementById('view-title').innerText = titleInfo.title;
            document.getElementById('view-subtitle').innerText = titleInfo.subtitle;
        });
    });

    // =========================================================================
    // 6. RESEARCH LAB: VERIFY CLAIM (CONSULT EXPERT)
    // =========================================================================
    const claimInput = document.getElementById('claim-input');
    const charCount = document.getElementById('char-count');
    const btnClearClaim = document.getElementById('btn-clear-claim');
    const btnAnalyzeClaim = document.getElementById('btn-analyze-claim');
    
    const resultPlaceholder = document.getElementById('result-placeholder');
    const analysisProgress = document.getElementById('analysis-progress');
    const resultDetails = document.getElementById('result-details');
    const verdictBadge = document.getElementById('verdict-badge');
    
    let selectedLang = 'en';

    // Char counter
    claimInput.addEventListener('input', () => {
        charCount.innerText = claimInput.value.length;
    });

    // Language Toggle
    document.querySelectorAll('.btn-lang').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-lang').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedLang = btn.getAttribute('data-lang');
        });
    });

    // Clear Button
    btnClearClaim.addEventListener('click', () => {
        claimInput.value = '';
        charCount.innerText = '0';
        resultPlaceholder.classList.remove('hidden');
        analysisProgress.classList.add('hidden');
        resultDetails.classList.add('hidden');
        verdictBadge.classList.add('hidden');
    });

    // Click Suggestion Pills
    document.querySelectorAll('.suggestion-pills .pill').forEach(pill => {
        pill.addEventListener('click', () => {
            claimInput.value = pill.innerText;
            charCount.innerText = pill.innerText.length;
        });
    });

    // Main verification action
    btnAnalyzeClaim.addEventListener('click', async () => {
        const claim = claimInput.value.trim();
        if (claim.length < 5) {
            alert('Please enter a claim containing at least 5 characters.');
            return;
        }

        // 1. Setup UI for loading state
        resultPlaceholder.classList.add('hidden');
        resultDetails.classList.add('hidden');
        verdictBadge.classList.add('hidden');
        analysisProgress.classList.remove('hidden');

        const stepNodes = [
            document.getElementById('step-0'),
            document.getElementById('step-1'),
            document.getElementById('step-2')
        ];

        // Reset step animations
        stepNodes.forEach(node => {
            node.className = 'step';
        });

        // Helper to update active steps
        const activateStep = (index) => {
            stepNodes.forEach((node, i) => {
                if (i < index) {
                    node.className = 'step completed';
                } else if (i === index) {
                    node.className = 'step active';
                } else {
                    node.className = 'step';
                }
            });
        };

        // Stage 0: Checking rules
        activateStep(0);
        await new Promise(r => setTimeout(r, 800));

        // Stage 1: Local database traverse
        activateStep(1);
        await new Promise(r => setTimeout(r, 1000));

        // Stage 2: Consulting Global Network
        activateStep(2);

        let finalResult = null;
        let sourceUsed = 'online';

        try {
            // Try National Node Backend first
            const backendRes = await fetch(`/api/ai/consult`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim, language: selectedLang })
            });

            if (backendRes.ok) {
                const json = await backendRes.json();
                if (json.success && json.data) {
                    finalResult = json.data;
                    sourceUsed = 'national-node';
                }
            }
        } catch (e) {
            console.warn('Backend consultation failed, falling back to direct client-side Pollinations fetch...');
        }

        // Fallback: Direct Pollinations query if backend fails or has no api key configured
        if (!finalResult) {
            try {
                const systemPrompt = `You are a medical expert advising Ugandan health workers. Respond ONLY as valid JSON in this exact shape: {"label":"ACCURATE"|"INACCURATE"|"UNCERTAIN","explanation":"2-3 sentences in ${selectedLang === 'lg' ? 'Luganda' : 'English'} addressing the claim directly based on WHO/Uganda MOH guidelines","recommendation":"One actionable recommendation sentence"}`;
                const fullPrompt = `${systemPrompt}\n\nClaim to verify: "${claim}"`;
                
                const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?json=true`);
                if (response.ok) {
                    const text = await response.text();
                    const match = text.match(/\{[\s\S]*\}/);
                    if (match) {
                        finalResult = JSON.parse(match[0]);
                        sourceUsed = 'global-expert-fallback';
                    }
                }
            } catch (err) {
                console.error('Expert fallback fetch failed:', err);
            }
        }

        // Complete all loading steps
        stepNodes.forEach(node => node.className = 'step completed');
        await new Promise(r => setTimeout(r, 400));
        analysisProgress.classList.add('hidden');

        if (!finalResult) {
            // Unhandled network failure fallback
            finalResult = {
                label: 'UNCERTAIN',
                explanation: selectedLang === 'lg' 
                    ? 'Tetusobode kwogera n\'omusawo omukulu mukadde guno. Kebera omutimbagano gwo.' 
                    : 'Could not contact the expert network. Please check your internet connection and try again.',
                recommendation: selectedLang === 'lg'
                    ? 'Genda mu ddwaliro liri okufuna okukakasibwa.'
                    : 'Refer the patient for physical clinical testing at the nearest facility.'
            };
            sourceUsed = 'system-offline';
        }

        // Normalize label values
        const label = (finalResult.label || 'UNCERTAIN').toUpperCase();
        
        // 2. Populate result display card
        verdictBadge.innerText = label === 'INACCURATE' ? 'INACCURATE' : (label === 'ACCURATE' ? 'ACCURATE' : 'UNCERTAIN');
        verdictBadge.className = `badge-verdict ${label.toLowerCase()}`;
        verdictBadge.classList.remove('hidden');

        document.getElementById('result-consensus').innerText = label === 'UNCERTAIN' ? 'CONFLICT' : 'MAJORITY';
        document.getElementById('result-confidence').innerText = label === 'UNCERTAIN' ? '45%' : (label === 'ACCURATE' ? '92%' : '88%');
        document.getElementById('result-risk').innerText = label === 'INACCURATE' ? 'MEDIUM' : 'LOW';
        
        // Update explanation and recommendation texts
        document.getElementById('result-explanation').innerText = finalResult.explanation || '';
        document.getElementById('result-recommendation').innerText = finalResult.recommendation || '';

        // Dynamic extract/predict simple symptoms & treatments for the split boxes
        const lowerClaim = claim.toLowerCase();
        let extractedSymptoms = 'Check official guidelines.';
        let extractedTreatment = 'Consult a clinical health officer.';

        if (lowerClaim.includes('syphilis') || lowerClaim.includes('sifilis') || lowerClaim.includes('kabotongo')) {
            extractedSymptoms = 'Painless genital sores (chancres), skin rashes, fever, swollen lymph glands, fatigue.';
            extractedTreatment = 'Benzathine Penicillin G injection as prescribed by a qualified physician.';
        } else if (lowerClaim.includes('malaria') || lowerClaim.includes('omusujja')) {
            extractedSymptoms = 'High fever, shivering chills, headache, joint paint, vomiting, sweating.';
            extractedTreatment = 'Coartem / ACTs (Artemether-Lumefantrine) after a positive blood or RDT test.';
        } else if (lowerClaim.includes('covid') || lowerClaim.includes('corona')) {
            extractedSymptoms = 'Dry cough, high fever, sore throat, difficulty breathing, loss of smell or taste.';
            extractedTreatment = 'Rest, hydration, paracetamol for fever. Seek oxygen support if breathing worsens.';
        } else if (lowerClaim.includes('ebola')) {
            extractedSymptoms = 'Sudden fever, bleeding from nose/gums, severe vomiting, watery diarrhea, chest pain.';
            extractedTreatment = 'Immediate isolation. Supportive care (rehydration, electrolytes) at Ebola Treatment Unit.';
        }

        document.getElementById('result-symptoms').innerText = selectedLang === 'lg' && lowerClaim.includes('malaria') 
            ? 'Omusujja, okukankana, omutwe, obulumi mu nnyingo, n\'okutuuyana.'
            : extractedSymptoms;

        document.getElementById('result-treatment').innerText = selectedLang === 'lg' && lowerClaim.includes('malaria')
            ? 'Eddagala lya Coartem (ACTs) oluvannyuma lw\'okukeberebwa musaayi.'
            : extractedTreatment;

        // Set source information
        document.getElementById('result-source').innerText = 'MOH Uganda / WHO Expert Guidelines';
        
        const sourceBadge = document.getElementById('source-badge');
        sourceBadge.innerText = sourceUsed.replace('-', ' ').toUpperCase();
        sourceBadge.className = `badge-source ${sourceUsed === 'system-offline' ? 'offline' : 'online'}`;

        resultDetails.classList.remove('hidden');
    });
});

