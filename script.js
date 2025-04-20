document.addEventListener('DOMContentLoaded', function() {
    // Initialize empty data structures - no dummy data
    const diseaseCases = [];
    const trendData = {};
    const patientFeed = [];
    const alerts = [];

    // Common disease list for autocomplete
    const commonDiseases = [
        "COVID-19", "Influenza", "Pneumonia", "Diabetes", "Hypertension",
        "Asthma", "Tuberculosis", "Malaria", "Dengue Fever", "Heart Disease",
        "Stroke", "Cancer", "Alzheimer's Disease", "Parkinson's Disease",
        "Chronic Obstructive Pulmonary Disease", "Kidney Disease", "Liver Disease",
        "Arthritis", "Osteoporosis", "Depression", "Anxiety Disorder"
    ];

    // Equipment needs mapping based on diseases
    const diseaseEquipmentMap = {
        "COVID-19": [
            { name: "Ventilators", quantity: 1, per: 10 },
            { name: "Oxygen Concentrators", quantity: 1, per: 5 },
            { name: "PPE Kits", quantity: 5, per: 1 }
        ],
        "Influenza": [
            { name: "IV Fluid Sets", quantity: 1, per: 3 },
            { name: "Nebulizers", quantity: 1, per: 8 }
        ],
        "Pneumonia": [
            { name: "Oxygen Cylinders", quantity: 1, per: 4 },
            { name: "Antibiotics", quantity: 1, per: 1 }
        ],
        "Heart Disease": [
            { name: "ECG Machines", quantity: 1, per: 20 },
            { name: "Defibrillators", quantity: 1, per: 30 },
            { name: "Cardiac Monitors", quantity: 1, per: 10 }
        ],
        "Stroke": [
            { name: "CT Scanners", quantity: 1, per: 50 },
            { name: "Blood Thinners", quantity: 1, per: 1 }
        ],
        "Asthma": [
            { name: "Inhalers", quantity: 1, per: 1 },
            { name: "Nebulizers", quantity: 1, per: 10 }
        ],
        "Diabetes": [
            { name: "Glucose Monitors", quantity: 1, per: 5 },
            { name: "Insulin", quantity: 1, per: 1 }
        ],
        "Hypertension": [
            { name: "Blood Pressure Monitors", quantity: 1, per: 10 },
            { name: "Antihypertensive Drugs", quantity: 1, per: 1 }
        ],
        "Dengue Fever": [
            { name: "IV Fluid Sets", quantity: 1, per: 2 },
            { name: "Blood Testing Kits", quantity: 1, per: 1 },
            { name: "Mosquito Nets", quantity: 1, per: 2 }
        ],
        "Malaria": [
            { name: "Antimalarial Drugs", quantity: 1, per: 1 },
            { name: "Blood Testing Kits", quantity: 1, per: 1 },
            { name: "Mosquito Nets", quantity: 1, per: 2 }
        ]
    };

    // Define a consistent color palette for diseases
    const diseaseColors = {
        // Pre-defined colors for common diseases
        "COVID-19": "#36A2EB",
        "Influenza": "#FF6384",
        "Pneumonia": "#4BC0C0",
        "Diabetes": "#9966FF",
        "Hypertension": "#FF9F40",
        "Asthma": "#FFCD56",
        "Tuberculosis": "#C9CBCF",
        "Malaria": "#7FD8BE",
        "Dengue Fever": "#66C2A5",
        "Heart Disease": "#FC8D62",
        // Fallback colors for other diseases
        "_fallback": [
            "#8DD3C7", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", 
            "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5",
            "#FFED6F", "#E78AC3", "#A6D854", "#FFD92F", "#E5C494"
        ]
    };

    // Color counter for fallback colors
    let colorCounter = 0;
    
    // Function to get a consistent color for a disease
    function getDiseaseColor(disease) {
        if (diseaseColors[disease]) {
            return diseaseColors[disease];
        } else {
            // Assign a fallback color and store it for consistency
            if (!diseaseColors[disease]) {
                diseaseColors[disease] = diseaseColors._fallback[colorCounter % diseaseColors._fallback.length];
                colorCounter++;
            }
            return diseaseColors[disease];
        }
    }

    // Initialize the trends chart
    const trendsChartCtx = document.getElementById('trends-chart').getContext('2d');
    const trendsChart = new Chart(trendsChartCtx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' cases';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cases'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    // Initialize the distribution chart
    const distributionChartCtx = document.getElementById('distribution-chart').getContext('2d');
    const distributionChart = new Chart(distributionChartCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value * 100) / total);
                            return `${label}: ${value} cases (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value * 100) / total);
                        return value > 0 ? value : '';
                    },
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 12
                    }
                }
            }
        }
    });

    // Initialize the prediction chart
    const predictionChartCtx = document.getElementById('prediction-chart').getContext('2d');
    const predictionChart = new Chart(predictionChartCtx, {
        type: 'line',
        data: {
            labels: getNext14Days(),
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' predicted cases';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Predicted Cases'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // Set up autocomplete for disease input
    const diseaseInput = document.getElementById('disease-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    
    diseaseInput.addEventListener('input', function() {
        const inputValue = this.value.toLowerCase();
        
        // Clear previous autocomplete items
        autocompleteList.innerHTML = '';
        
        if (inputValue.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }
        
        // Filter diseases that match the input
        const matchingDiseases = commonDiseases.filter(disease => 
            disease.toLowerCase().includes(inputValue)
        );
        
        if (matchingDiseases.length > 0) {
            autocompleteList.style.display = 'block';
            
            // Create a div for each matching disease
            matchingDiseases.forEach(disease => {
                const item = document.createElement('div');
                item.textContent = disease;
                item.addEventListener('click', function() {
                    diseaseInput.value = disease;
                    autocompleteList.style.display = 'none';
                });
                autocompleteList.appendChild(item);
            });
        } else {
            autocompleteList.style.display = 'none';
        }
    });
    
    // Hide autocomplete list when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== diseaseInput) {
            autocompleteList.style.display = 'none';
        }
    });

    // Handle form submission
    const diseaseForm = document.getElementById('disease-form');
    diseaseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const diseaseName = diseaseInput.value.trim();
        const patientId = document.getElementById('patient-id').value.trim();
        const severity = document.getElementById('severity').value;
        const department = document.getElementById('department').value;
        
        if (!diseaseName || !patientId) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Add or update the disease case
        addDiseaseCase(diseaseName, severity, department, patientId);
        
        // Clear the form
        diseaseForm.reset();
        
        // Update the UI
        updateAllCharts();
        updateStatsSummary();
        generateAlerts();
        generateEquipmentNeeds();
        updateTrendingDiseases();
        updatePatientFeed();
    });

    // Function to add or update a disease case
    function addDiseaseCase(diseaseName, severity, department, patientId) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if the disease already exists in our data
        const existingDiseaseIndex = diseaseCases.findIndex(item => 
            item.disease.toLowerCase() === diseaseName.toLowerCase()
        );
        
        if (existingDiseaseIndex !== -1) {
            // Update existing disease count
            diseaseCases[existingDiseaseIndex].count += 1;
            diseaseCases[existingDiseaseIndex].severity = severity;
            diseaseCases[existingDiseaseIndex].department = department;
            diseaseCases[existingDiseaseIndex].date = today;
        } else {
            // Add new disease
            diseaseCases.push({
                disease: diseaseName,
                count: 1,
                severity: severity,
                department: department,
                date: today
            });
            
            // Make sure it has a consistent color
            getDiseaseColor(diseaseName);
        }
        
        // Update trend data
        if (!trendData[diseaseName]) {
            // Initialize with zeros for past days
            trendData[diseaseName] = Array(7).fill(0);
        }
        
        // Increment today's count (last position in the array)
        trendData[diseaseName][6] += 1;
        
        // Add to patient feed
        patientFeed.unshift({
            patientId,
            disease: diseaseName,
            severity,
            department,
            date: today
        });
        
        // Keep only the last 10 entries in the feed
        if (patientFeed.length > 10) {
            patientFeed.pop();
        }
        
        // Update total patients count
        document.getElementById('total-patients').textContent = patientFeed.length;
        
        console.log(`Added/updated disease: ${diseaseName}`);
        console.log(`Current disease cases:`, diseaseCases);
        console.log(`Current trend data:`, trendData);
    }

    // Function to update all charts
    function updateAllCharts() {
        updateTrendsChart();
        updateDistributionChart();
        updatePredictionChart();
    }

    // Function to update the trends chart
    function updateTrendsChart() {
        if (diseaseCases.length === 0) {
            trendsChart.data.datasets = [];
            trendsChart.update();
            updateChartLegend('trends-legend', []);
            return;
        }
        
        console.log("Updating trends chart with diseases:", diseaseCases.map(d => d.disease));
        
        // Create datasets for each disease
        const datasets = diseaseCases.map(diseaseCase => {
            const disease = diseaseCase.disease;
            const color = getDiseaseColor(disease);
            
            return {
                label: disease,
                data: trendData[disease] || Array(7).fill(0),
                borderColor: color,
                backgroundColor: color + '20',
                tension: 0.3,
                borderWidth: 2,
                fill: false
            };
        });
        
        console.log("Created datasets for trends chart:", datasets);
        
        // Update chart data
        trendsChart.data.datasets = datasets;
        
        // Update chart
        trendsChart.update();
        
        // Update legend
        updateChartLegend('trends-legend', datasets);
    }

    // Function to update the distribution chart
    function updateDistributionChart() {
        if (diseaseCases.length === 0) {
            distributionChart.data.labels = [];
            distributionChart.data.datasets[0].data = [];
            distributionChart.data.datasets[0].backgroundColor = [];
            distributionChart.update();
            return;
        }
        
        // Sort diseases by count in descending order
        const sortedData = [...diseaseCases].sort((a, b) => b.count - a.count);
        
        // Take top 5 diseases for better visualization
        const topDiseases = sortedData.slice(0, 5);
        
        // Update chart data
        distributionChart.data.labels = topDiseases.map(item => item.disease);
        distributionChart.data.datasets[0].data = topDiseases.map(item => item.count);
        distributionChart.data.datasets[0].backgroundColor = topDiseases.map(item => getDiseaseColor(item.disease));
        
        // Update chart
        distributionChart.update();
    }

    // Function to update statistics summary
    function updateStatsSummary() {
        const totalCases = diseaseCases.reduce((sum, item) => sum + item.count, 0);
        
        // Find most frequent disease
        const mostFrequentDisease = diseaseCases.length > 0 
            ? diseaseCases.reduce((prev, current) => 
                prev.count > current.count ? prev : current
            ).disease 
            : 'None';
        
        // Count critical cases
        const criticalCases = diseaseCases
            .filter(item => item.severity === 'critical')
            .reduce((sum, item) => sum + item.count, 0);
        
        // Update the DOM
        document.getElementById('total-cases').textContent = totalCases;
        document.getElementById('most-frequent').textContent = mostFrequentDisease;
        document.getElementById('critical-cases').textContent = criticalCases;
        
        // Update notification badge
        document.getElementById('notification-count').textContent = alerts.length;
    }

    // Function to generate alerts based on disease data
    function generateAlerts() {
        const alertsContainer = document.getElementById('alerts-container');
        
        // Clear previous alerts
        alertsContainer.innerHTML = '';
        
        // Reset alerts array
        alerts.length = 0;
        
        if (diseaseCases.length === 0) {
            alertsContainer.innerHTML = `
                <div class="empty-alerts">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 12L10.5 14.5L16 9" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>No active alerts. Add disease data to generate alerts.</p>
                </div>
            `;
            return;
        }
        
        // Generate predictions to check for potential outbreaks
        const predictions = generatePredictions();
        
        // Check for rapidly increasing diseases (potential outbreaks)
        const rapidIncreases = predictions
            .filter(pred => pred.percentChange > 20)
            .sort((a, b) => b.percentChange - a.percentChange);
        
        // Check for critical severity diseases
        const criticalDiseases = diseaseCases
            .filter(item => item.severity === 'critical')
            .sort((a, b) => b.count - a.count);
        
        // Check for department overloads
        const departmentCounts = {};
        patientFeed.forEach(patient => {
            if (!departmentCounts[patient.department]) {
                departmentCounts[patient.department] = 0;
            }
            departmentCounts[patient.department]++;
        });
        
        const overloadedDepartments = Object.entries(departmentCounts)
            .filter(([dept, count]) => {
                // Define thresholds for department overloads
                const thresholds = {
                    'icu': 5,
                    'emergency': 8,
                    'general': 12,
                    'pediatric': 6,
                    'outpatient': 15
                };
                return count >= thresholds[dept];
            })
            .sort((a, b) => b[1] - a[1]);
        
        // Generate alerts for rapid increases (potential outbreaks)
        rapidIncreases.forEach(prediction => {
            const alertId = `outbreak-${prediction.disease.toLowerCase().replace(/\s+/g, '-')}`;
            alerts.push({
                id: alertId,
                type: 'warning',
                title: `Potential ${prediction.disease} Outbreak`,
                message: `${prediction.disease} cases are increasing rapidly (${prediction.percentChange}% growth trend). Consider preparing additional resources.`,
                actions: [
                    { label: 'Prepare Resources', type: 'primary' },
                    { label: 'Dismiss', type: 'secondary' }
                ]
            });
        });
        
        // Generate alerts for critical cases
        criticalDiseases.forEach(disease => {
            const alertId = `critical-${disease.disease.toLowerCase().replace(/\s+/g, '-')}`;
            alerts.push({
                id: alertId,
                type: 'critical',
                title: `Critical ${disease.disease} Cases`,
                message: `There are ${disease.count} critical ${disease.disease} cases that require immediate medical attention.`,
                actions: [
                    { label: 'Assign Staff', type: 'primary' },
                    { label: 'View Details', type: 'secondary' }
                ]
            });
        });
        
        // Generate alerts for department overloads
        overloadedDepartments.forEach(([department, count]) => {
            const alertId = `overload-${department.toLowerCase().replace(/\s+/g, '-')}`;
            const deptName = department.charAt(0).toUpperCase() + department.slice(1);
            alerts.push({
                id: alertId,
                type: 'info',
                title: `${deptName} Department Overload`,
                message: `The ${deptName} department has ${count} patients, which may exceed capacity. Consider redistributing resources.`,
                actions: [
                    { label: 'Redistribute', type: 'primary' },
                    { label: 'Monitor', type: 'secondary' }
                ]
            });
        });
        
        // Check for equipment shortages based on predictions
        const equipmentNeeds = generateEquipmentPredictions();
        const criticalEquipment = Object.entries(equipmentNeeds)
            .filter(([name, data]) => data.quantity > 10)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 2);
        
        criticalEquipment.forEach(([equipment, data]) => {
            const alertId = `equipment-${equipment.toLowerCase().replace(/\s+/g, '-')}`;
            alerts.push({
                id: alertId,
                type: 'warning',
                title: `${equipment} Shortage Predicted`,
                message: `Based on current trends, you'll need ${data.quantity} units of ${equipment}. Check inventory levels.`,
                actions: [
                    { label: 'Order Supplies', type: 'primary' },
                    { label: 'Check Inventory', type: 'secondary' }
                ]
            });
        });
        
        // If no alerts were generated, show "all clear" message
        if (alerts.length === 0) {
            alerts.push({
                id: 'all-clear',
                type: 'success',
                title: 'All Systems Normal',
                message: 'No significant disease outbreaks or critical cases detected. Continue monitoring.',
                actions: [
                    { label: 'Refresh Data', type: 'primary' }
                ]
            });
        }
        
        // Update notification badge
        document.getElementById('notification-count').textContent = alerts.length;
        
        // Render alerts
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-item ${alert.type}`;
            alertElement.id = alert.id;
            
            let iconSvg = '';
            switch (alert.type) {
                case 'critical':
                    iconSvg = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 8V12" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 16H12.01" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    break;
                case 'warning':
                    iconSvg = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.6415 19.6871 1.81442 19.9905C1.98734 20.2939 2.23672 20.5467 2.53773 20.7238C2.83875 20.9009 3.1808 20.9961 3.53 21H20.47C20.8192 20.9961 21.1613 20.9009 21.4623 20.7238C21.7633 20.5467 22.0127 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="#FFB84D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 9V13" stroke="#FFB84D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 17H12.01" stroke="#FFB84D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    break;
                case 'info':
                    iconSvg = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 16V12" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 8H12.01" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    break;
                case 'success':
                    iconSvg = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 12L10.5 14.5L16 9" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    break;
            }
            
            const actionsHtml = alert.actions.map(action => 
                `<button class="alert-btn ${action.type}">${action.label}</button>`
            ).join('');
            
            alertElement.innerHTML = `
                <div class="alert-icon">
                    ${iconSvg}
                </div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                    <div class="alert-actions">
                        ${actionsHtml}
                    </div>
                </div>
            `;
            
            alertsContainer.appendChild(alertElement);
        });
        
        // Add event listeners to alert buttons
        document.querySelectorAll('.alert-btn').forEach(button => {
            button.addEventListener('click', function() {
                const alertItem = this.closest('.alert-item');
                if (this.textContent.trim() === 'Dismiss' || this.textContent.trim() === 'Monitor') {
                    alertItem.remove();
                    // Update alerts array
                    const alertIndex = alerts.findIndex(a => a.id === alertItem.id);
                    if (alertIndex !== -1) {
                        alerts.splice(alertIndex, 1);
                        // Update notification badge
                        document.getElementById('notification-count').textContent = alerts.length;
                    }
                }
            });
        });
    }

    // Function to generate equipment needs prediction
    function generateEquipmentNeeds() {
        const equipmentContainer = document.getElementById('equipment-container');
        equipmentContainer.innerHTML = '';
        
        if (diseaseCases.length === 0) {
            equipmentContainer.innerHTML = '<p class="no-predictions">Enter disease data to see equipment predictions.</p>';
            return;
        }
        
        const equipmentNeeds = generateEquipmentPredictions();
        
        // Sort equipment by quantity needed
        const sortedEquipment = Object.entries(equipmentNeeds)
            .sort((a, b) => b[1].quantity - a[1].quantity);
        
        if (sortedEquipment.length > 0) {
            sortedEquipment.forEach(([name, data]) => {
                const equipmentItem = document.createElement('div');
                equipmentItem.className = 'equipment-item';
                
                const icon = document.createElement('div');
                icon.className = 'equipment-icon';
                icon.textContent = name.charAt(0);
                
                const details = document.createElement('div');
                details.className = 'equipment-details';
                
                const equipmentName = document.createElement('div');
                equipmentName.className = 'equipment-name';
                equipmentName.textContent = name;
                
                const primaryDisease = data.diseases.sort((a, b) => b.count - a.count)[0];
                const equipmentReason = document.createElement('div');
                equipmentReason.className = 'equipment-reason';
                equipmentReason.textContent = `Needed for ${primaryDisease.name} (${primaryDisease.count} cases)`;
                
                const quantity = document.createElement('div');
                quantity.className = 'equipment-quantity';
                quantity.textContent = `${data.quantity} units`;
                
                details.appendChild(equipmentName);
                details.appendChild(equipmentReason);
                
                equipmentItem.appendChild(icon);
                equipmentItem.appendChild(details);
                equipmentItem.appendChild(quantity);
                
                equipmentContainer.appendChild(equipmentItem);
            });
        } else {
            equipmentContainer.innerHTML = '<p class="no-predictions">No equipment predictions available yet.</p>';
        }
    }

    // Function to generate equipment predictions
    function generateEquipmentPredictions() {
        const equipmentNeeds = {};
        
        // Calculate equipment needs based on disease trends
        diseaseCases.forEach(diseaseCase => {
            const equipment = diseaseEquipmentMap[diseaseCase.disease];
            if (equipment) {
                equipment.forEach(item => {
                    const requiredQuantity = Math.ceil(diseaseCase.count / item.per) * item.quantity;
                    
                    if (!equipmentNeeds[item.name]) {
                        equipmentNeeds[item.name] = {
                            quantity: requiredQuantity,
                            diseases: [{ name: diseaseCase.disease, count: diseaseCase.count }]
                        };
                    } else {
                        equipmentNeeds[item.name].quantity += requiredQuantity;
                        
                        // Check if disease already exists in the list
                        const existingDisease = equipmentNeeds[item.name].diseases.find(d => d.name === diseaseCase.disease);
                        if (existingDisease) {
                            existingDisease.count += diseaseCase.count;
                        } else {
                            equipmentNeeds[item.name].diseases.push({ name: diseaseCase.disease, count: diseaseCase.count });
                        }
                    }
                });
            }
        });
        
        return equipmentNeeds;
    }

    // Function to update trending diseases
    function updateTrendingDiseases() {
        if (diseaseCases.length === 0) {
            resetTrendingDiseaseCards();
            return;
        }
        
        // Generate predictions to get trend percentages
        const predictions = generatePredictions();
        
        // Sort by percent change
        const sortedPredictions = [...predictions].sort((a, b) => b.percentChange - a.percentChange);
        
        // Update trending disease cards
        for (let i = 0; i < 3; i++) {
            const cardId = `trending-disease-${i + 1}`;
            const card = document.getElementById(cardId);
            
            if (i < sortedPredictions.length) {
                const prediction = sortedPredictions[i];
                const disease = prediction.disease;
                const color = getDiseaseColor(disease);
                const percentChange = prediction.percentChange;
                
                // Determine status text based on percent change
                let statusText = 'Trending Disease';
                if (percentChange > 20) {
                    statusText = 'Rapid Increase';
                } else if (percentChange < 0) {
                    statusText = 'Decreasing';
                } else if (percentChange === 0) {
                    statusText = 'Stable';
                }
                
                // Update card content
                card.innerHTML = `
                    <div class="disease-icon" style="background-color: ${color}20; color: ${color}">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 7V17M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="disease-info">
                        <h3>${disease}</h3>
                        <p>${statusText}</p>
                    </div>
                    <div class="trend-percentage" style="color: ${percentChange > 0 ? '#4CAF50' : (percentChange < 0 ? '#FF6B6B' : '#666666')}">
                        ${percentChange > 0 ? '+' : ''}${percentChange}%
                    </div>
                `;
            } else {
                // Reset card if we don't have enough diseases
                card.innerHTML = `
                    <div class="disease-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#2DBEB9" stroke-width="2"/>
                            <path d="M12 7V17M7 12H17" stroke="#2DBEB9" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="disease-info">
                        <h3>No Data</h3>
                        <p>Add disease data</p>
                    </div>
                    <div class="trend-percentage">+0%</div>
                `;
            }
        }
    }

    // Function to reset trending disease cards
    function resetTrendingDiseaseCards() {
        for (let i = 1; i <= 3; i++) {
            const cardId = `trending-disease-${i}`;
            const card = document.getElementById(cardId);
            
            card.innerHTML = `
                <div class="disease-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#2DBEB9" stroke-width="2"/>
                        <path d="M12 7V17M7 12H17" stroke="#2DBEB9" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="disease-info">
                    <h3>No Data</h3>
                    <p>Add disease data</p>
                </div>
                <div class="trend-percentage">+0%</div>
            `;
        }
    }

    // Function to generate predictions
    function generatePredictions() {
        const predictions = [];
        
        // Only predict for diseases that have been entered
        diseaseCases.forEach(diseaseCase => {
            const disease = diseaseCase.disease;
            const data = trendData[disease];
            
            if (data && data.length >= 3) {
                // Get the last three days of data
                const lastThreeDays = data.slice(-3);
                
                // Calculate trend only if we have non-zero values
                if (lastThreeDays[0] > 0 || lastThreeDays[1] > 0 || lastThreeDays[2] > 0) {
                    // Calculate trend (avoid division by zero)
                    const trend = lastThreeDays[0] > 0 ? 
                        (lastThreeDays[2] - lastThreeDays[0]) / lastThreeDays[0] : 
                        lastThreeDays[2] > 0 ? 1 : 0;
                    
                    // Generate future data points
                    const futureDays = 14; // Predict for next 14 days
                    const futurePrediction = [];
                    let lastValue = data[data.length - 1];
                    
                    for (let i = 0; i < futureDays; i++) {
                        // Apply a dampening factor as we go further into the future
                        const dampening = Math.max(0.8, 1 - (i * 0.01));
                        const growthFactor = 1 + (trend * dampening);
                        lastValue = Math.max(0, Math.round(lastValue * growthFactor));
                        futurePrediction.push(lastValue);
                    }
                    
                    // Calculate overall trend
                    const overallTrend = data[data.length - 1] > 0 ? 
                        (futurePrediction[futurePrediction.length - 1] - data[data.length - 1]) / data[data.length - 1] : 
                        futurePrediction[futurePrediction.length - 1] > 0 ? 1 : 0;
                    
                    predictions.push({
                        disease,
                        currentCount: data[data.length - 1],
                        predictedCount: futurePrediction[futurePrediction.length - 1],
                        percentChange: Math.round(overallTrend * 100),
                        futurePrediction
                    });
                }
            } else {
                // For newly added diseases with insufficient trend data
                predictions.push({
                    disease,
                    currentCount: diseaseCase.count,
                    predictedCount: diseaseCase.count,
                    percentChange: 0,
                    futurePrediction: Array(14).fill(diseaseCase.count)
                });
            }
        });
        
        return predictions;
    }

    // Function to update prediction chart
    function updatePredictionChart() {
        if (diseaseCases.length === 0) {
            predictionChart.data.datasets = [];
            predictionChart.update();
            updateChartLegend('forecast-legend', []);
            return [];
        }
        
        // Generate predictions
        const predictions = generatePredictions();
        
        // Create datasets for chart
        const datasets = predictions.map(prediction => {
            const disease = prediction.disease;
            const color = getDiseaseColor(disease);
            
            // Create dataset with current value + future predictions
            const data = [prediction.currentCount, ...prediction.futurePrediction];
            
            return {
                label: disease,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                fill: false,
                tension: 0.3,
                borderWidth: 2,
                borderDash: [5, 5], // Make forecast lines dashed to distinguish from trends
                pointStyle: 'circle'
            };
        });
        
        // Update chart
        predictionChart.data.datasets = datasets;
        predictionChart.update();
        
        // Update legend
        updateChartLegend('forecast-legend', datasets);
        
        return predictions;
    }

    // Function to update chart legends
    function updateChartLegend(elementId, datasets) {
        const legendElement = document.getElementById(elementId);
        if (!legendElement) return;
        
        legendElement.innerHTML = '';
        
        datasets.forEach(dataset => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = dataset.borderColor;
            
            const label = document.createElement('span');
            label.textContent = dataset.label;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            
            legendElement.appendChild(legendItem);
        });
    }

    // Function to update patient feed
    function updatePatientFeed() {
        const patientFeedElement = document.getElementById('patient-feed');
        patientFeedElement.innerHTML = '';
        
        if (patientFeed.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="4" style="text-align: center;">No patient data available</td>`;
            patientFeedElement.appendChild(emptyRow);
            return;
        }
        
        patientFeed.forEach(patient => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${patient.patientId}</td>
                <td>${patient.disease}</td>
                <td>${patient.severity.charAt(0).toUpperCase() + patient.severity.slice(1)}</td>
                <td>${patient.department.charAt(0).toUpperCase() + patient.department.slice(1)}</td>
            `;
            
            patientFeedElement.appendChild(row);
        });
    }

    // Helper function to get last 7 days
    function getLast7Days() {
        const dates = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        return dates;
    }

    // Helper function to get next 14 days
    function getNext14Days() {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        return dates;
    }

    // Set up event listeners for quick action buttons
    document.getElementById('generate-report-btn').addEventListener('click', function() {
        alert('Report generation feature will be implemented in a future update.');
    });

    document.getElementById('export-data-btn').addEventListener('click', function() {
        alert('Data export feature will be implemented in a future update.');
    });

    // Set hospital name and location
    document.getElementById('hospital-name').textContent = 'Shaukat Hospital';
    document.getElementById('hospital-location').textContent = 'Lahore';
});