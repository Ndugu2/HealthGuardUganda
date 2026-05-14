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
});
