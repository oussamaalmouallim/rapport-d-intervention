window.jsPDF = window.jspdf.jsPDF;
let problemTypeHistory = [];
let interventionTypeHistory = [];

function updateDateTime() {
  const now = new Date();
  document.getElementById('datetime').textContent = now.toLocaleString('fr-FR');
}
setInterval(updateDateTime, 1000);
updateDateTime();

async function getLocationDetails(latitude, longitude) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'fr'
      }
    });
    if (!response.ok) throw new Error('Erreur réseau');
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'adresse:', error);
    return null;
  }
}

async function updateLocation() {
  const locationDiv = document.getElementById('location');
  try {
    locationDiv.textContent = 'Recherche de la position...';
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 0
      });
    });
    const {
      latitude,
      longitude
    } = position.coords;
    locationDiv.innerHTML = `
              <div>Coordonnées trouvées</div>
              <div class="location-details">
                Latitude: ${latitude.toFixed(6)}<br>
                Longitude: ${longitude.toFixed(6)}
              </div>
            `;
    const address = await getLocationDetails(latitude, longitude);
    if (address) {
      locationDiv.innerHTML = `
                <div>${address}</div>
                <div class="location-details">
                  Latitude: ${latitude.toFixed(6)}<br>
                  Longitude: ${longitude.toFixed(6)}
                </div>
              `;
    }
  } catch (error) {
    locationDiv.textContent = `Erreur de localisation: ${error.message}`;
  }
}
updateLocation();
setInterval(() => {
  if (document.getElementById('location').textContent.includes('Erreur') || document.getElementById('location').textContent.includes('Recherche')) {
    updateLocation();
  }
}, 60000);

document.getElementById('interventionType').addEventListener('change', function() {
  const problemType = document.getElementById('problemType');
  const responseTags = problemType.parentNode.querySelectorAll('.response-tag');
  responseTags.forEach(tag => tag.remove());
  problemType.innerHTML = '<option value="">Sélectionnez le problème</option>';
  const problems = {
    'electricite': ['Pannes de courant', 'Problèmes de câblage', 'Prises défectueuses', 'Éclairage défaillant', 'Autre'],
    'domotique': ['Problèmes de connectivité', 'Bugs logiciels', 'Erreurs de configuration', 'Mises à jour manquantes', 'Incompatibilité des appareils', 'Configuration point d\'accès', 'Autre'],
    'climatisation/chauffage': ['Insuffisance de refroidissement', 'Problèmes de thermostat', 'Bruits inhabituels', 'Autre'],
    'sonorisation': ['Problèmes de connectivité', 'Qualité sonore dégradée', 'Défaillance des amplificateurs', 'Pannes des haut-parleurs', 'Autre'],
    'videophone': ['Problèmes de connexion réseau', 'Problèmes d\'alimentation', 'Qualité vidéo ou audio dégradée', 'Bouton d\'appel défectueux', 'Problèmes de synchronisation', 'Installation', 'Configuration', 'Autre'],
    'supervision': ['Problèmes de connectivité', 'Erreurs système', 'Problèmes d\'affichage', 'Erreurs de données', 'Autre'],
    'autre': ['Autre']
  };
  const selectedType = this.value;
  if (selectedType) {
    interventionTypeHistory.push({
      type: selectedType,
      text: this.options[this.selectedIndex].text,
      timestamp: new Date()
    });
  }
  if (selectedType && problems[selectedType]) {
    let problemList = problems[selectedType];

    // Add "Configuration Domotique" to "Programmation (Domotique)" problems
    if (selectedType === 'domotique') {
      problemList = [...problemList, 'Configuration Domotique'];
    }

    problemList.forEach(problem => {
      const option = document.createElement('option');
      option.value = problem.toLowerCase().replace(/\s+/g, '_');
      option.textContent = problem;
      problemType.appendChild(option);
    });
  }
});

document.getElementById('problemType').addEventListener('change', function(e) {
  if (this.value) {
    problemTypeHistory.push({
      value: this.value,
      text: this.options[this.selectedIndex].text,
      timestamp: new Date()
    });
  }
  const responseTag = document.createElement('div');
  responseTag.className = 'response-tag';
  responseTag.textContent = this.options[this.selectedIndex].text;
  this.parentNode.appendChild(responseTag);
  updateSummaryTableThrottled();
});

document.querySelectorAll('input[name="status"]').forEach(radio => {
  radio.addEventListener('change', function(e) {
    const previousResponse = this.closest('.radio-group').nextElementSibling;
    if (previousResponse?.className === 'response-tag') {
      previousResponse.remove();
    }
    const responseTag = document.createElement('div');
    responseTag.className = 'response-tag';
    responseTag.textContent = this.labels[0].textContent;
    this.closest('.radio-group').after(responseTag);
    updateSummaryTableThrottled();
  });
});

document.getElementById('technicianName').addEventListener('change', function(e) {
  const previousResponse = this.nextElementSibling;
  if (previousResponse?.className === 'response-tag') {
    previousResponse.remove();
  }
  const responseTag = document.createElement('div');
  responseTag.className = 'response-tag';
  responseTag.textContent = this.options[this.selectedIndex].text;
  this.parentNode.appendChild(responseTag);
  updateSummaryTableThrottled();
});

function updateSummaryTable() {
  const summaryTableBody = document.getElementById('summaryTableBody');
  summaryTableBody.innerHTML = '';

  const technicianName = document.getElementById('technicianName');
  const submissionDate = document.getElementById('submissionDate');
  const projectName = document.getElementById('projectName');
  const interventionType = document.getElementById('interventionType');
  const problemType = document.getElementById('problemType');
  const status = document.querySelector('input[name="status"]:checked');
  const interventionStatus = document.getElementById('interventionStatus');
  const comments = document.getElementById('comments');

  const rows = [
    ['Date de Soumission', submissionDate.value],
    ['Date et Heure', document.getElementById('datetime').textContent],
    ['Localisation', document.getElementById('location').textContent],
    ['Projet/Client', projectName.value],
    ['Technicien', technicianName.options[technicianName.selectedIndex].text],
    ['Type d\'Intervention', interventionType.options[interventionType.selectedIndex].text],
    ['Nature du Problème', problemType.options[problemType.selectedIndex].text],
    ['État', status ? status.labels[0].textContent : ''],
    ['Statut de l\'intervention', interventionStatus.options[interventionStatus.selectedIndex].text],
    ['Commentaires', comments.value || "Pas de commentaire"]
  ];

  if (interventionTypeHistory.length > 1) {
    rows.push(['Historique des Types d\'Intervention', interventionTypeHistory.slice(0, -1).map(h => `${h.text} (${new Date(h.timestamp).toLocaleTimeString()})`).join(', ')]);
  }

  if (problemTypeHistory.length > 1) {
    rows.push(['Historique des Problèmes', problemTypeHistory.slice(0, -1).map(h => `${h.text} (${new Date(h.timestamp).toLocaleTimeString()})`).join(', ')]);
  }

  rows.forEach(([field, value]) => {
    if (value && value !== 'Sélectionnez un technicien' && value !== 'Sélectionnez le type' && value !== 'Sélectionnez le problème' && value !== 'Sélectionnez le statut') {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${field}</td>
                <td>${value}</td>
              `;
      summaryTableBody.appendChild(row);
    }
  });
}

let updateSummaryTimeout;
function updateSummaryTableThrottled() {
  clearTimeout(updateSummaryTimeout);
  updateSummaryTimeout = setTimeout(updateSummaryTable, 300);
}

document.getElementById('interventionStatus').addEventListener('change', function(e) {
  const previousResponse = this.nextElementSibling;
  if (previousResponse?.className === 'response-tag') {
    previousResponse.remove();
  }
  const responseTag = document.createElement('div');
  responseTag.className = 'response-tag';
  responseTag.textContent = this.options[this.selectedIndex].text;
  this.parentNode.appendChild(responseTag);
  updateSummaryTableThrottled();
});
document.getElementById('comments').addEventListener('input', function(e) {
  updateSummaryTableThrottled();
});
document.getElementById('projectName').addEventListener('input', function(e) {
  updateSummaryTableThrottled();
});
document.getElementById('submissionDate').addEventListener('change', function(e) {
  updateSummaryTableThrottled();
});

document.getElementById('toggleSummary').addEventListener('click', function() {
  const summaryModal = document.getElementById('summaryModal');
  const modalContent = summaryModal.querySelector('.modal-content');
  
  // Update summary table content
  updateSummaryTable();
  
  // Show modal with animation
  summaryModal.classList.add('modal-show');
  setTimeout(() => {
    modalContent.classList.add('modal-content-show');
  }, 10);
  
  // Change icon when toggled
  this.classList.toggle('active');
  if (this.classList.contains('active')) {
    this.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-13C7 2 2.73 5.11 1 9.5 2.73 13.89 7 17 12 17s9.27-3.11 11-7.5C21.27 5.11 17 2 12 2zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
      </svg>
    `;
  } else {
    this.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    `;
  }
});

// Add event listener for the close button
document.getElementById('closeModal').addEventListener('click', function() {
  const summaryModal = document.getElementById('summaryModal');
  const modalContent = summaryModal.querySelector('.modal-content');
  
  // Hide with animation
  modalContent.classList.remove('modal-content-show');
  setTimeout(() => {
    summaryModal.classList.remove('modal-show');
  }, 300);
  
  // Reset toggle button state
  const toggleButton = document.getElementById('toggleSummary');
  toggleButton.classList.remove('active');
  toggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  `;
});

// Close modal when clicking outside of content
document.getElementById('summaryModal').addEventListener('click', function(event) {
  if (event.target === this) {
    document.getElementById('closeModal').click();
  }
});

// Supabase Configuration
const supabaseUrl = "https://quflgxjymdocfcqwppxl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZmxneGp5bWRvY2ZjcXdwcHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjI5NzAsImV4cCI6MjA1NjM5ODk3MH0.084B-my88YIXT0TZ2uD0UT82xU2M4yRhBv2idNUSjLQ";

// Load Supabase library
const script = document.createElement('script');
script.src = "https://unpkg.com/@supabase/supabase-js";
script.onload = initSupabase;
document.head.appendChild(script);

function initSupabase() {
  // Initialize Supabase client
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // Add Supabase submission button
  const submitToSupabaseButton = document.createElement('button');
  submitToSupabaseButton.id = 'submitToSupabase';
  submitToSupabaseButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8h-2V7h2v2z"/>
    </svg>
    Send to Supabase
  `;
  submitToSupabaseButton.style.marginTop = '10px';
  
  const formActions = document.querySelector('.form-actions');
  formActions.appendChild(submitToSupabaseButton);

  // Supabase submission event listener
  submitToSupabaseButton.addEventListener('click', async function(event) {
    event.preventDefault();
    this.classList.add('active');
    
    // Collect data from summary table
    const summaryTable = document.getElementById('summaryTableBody');
    const summaryRows = Array.from(summaryTable.querySelectorAll('tr'));

    // Create an object to store report data
    const reportData = {};

    // Debugging function to clean and log keys
    function cleanKey(key) {
      const cleaned = key.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[()]/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/'/g, '_')
        .replace(/\//g, '_');
      return cleaned;
    }

    // Iterate through summary rows and populate reportData
    summaryRows.forEach(row => {
      const [field, value] = row.querySelectorAll('td');
      const rawKey = field.textContent;
      const cleanedKey = cleanKey(rawKey);

      // Log each key for debugging
      console.log(`Raw Key: "${rawKey}" -> Cleaned Key: "${cleanedKey}"`);

      reportData[cleanedKey] = value.textContent;
    });

    // More detailed debugging
    console.log('Prepared Report Data:', JSON.stringify(reportData, null, 2));

    try {
      // Send data to Supabase
      const { data, error } = await supabase
        .from("tis_interventions")
        .insert([reportData]);

      if (error) {
        console.error("Detailed Supabase Error:", error);
        console.log("Error Details:", {
          code: error.code,
          details: error.details,
          message: error.message
        });
        throw error;
      }

      alert("Rapport soumis avec succès sur Supabase !");
      submitToSupabaseButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        Sent to Supabase, thank you!
      `;
      setTimeout(() => submitToSupabaseButton.classList.remove('active'), 2000);

      // Optional: Reset intervention histories
      interventionTypeHistory = [];
      problemTypeHistory = [];

    } catch (error) {
      console.error("Erreur lors de l'envoi à Supabase :", error);
      alert(`Erreur lors de l'envoi du rapport à Supabase : ${error.message}`);
      submitToSupabaseButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8h-2V7h2v2z"/>
        </svg>
        Try again
      `;
      submitToSupabaseButton.classList.remove('active');
    }
  });
}

document.getElementById("technicianForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitTogooglesheet");
  submitBtn.innerText = "Envoi en cours...";
  submitBtn.classList.add('active');

  let formData = new FormData(technicianForm);

  fetch("https://script.google.com/macros/s/AKfycbwslJzwnb1OZA2VahPAafUrqr7_xah-xh-CUp88pzuSGm8KMUQu_1TReL1yhKYOmqn5iw/exec", {
      method: "POST",
      body: formData
    })
    .then(response => response.text())
    .then(data => {
      alert("Données envoyées avec succès !");
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.376 12.416L8.777 19.482c-.7.046-.137.078-.217.078-.133 0-.262-.053-.353-.146-.157-.148-.194-.368-.094-.558l3.53-6.39H5c-.202 0-.373-.116-.443-.3-.074-.181-.026-.385.116-.504l10.62-7.303c.094-.063.209-.095.323-.095.183 0 .341.084.437.232.094.147.105.333.026.49l-3.53 6.562h6.37c.204 0 .38.127.448.306.068.18.015.38-.12.495z"/>
        </svg>
        Send to Google Sheet
      `;
      setTimeout(() => submitBtn.classList.remove('active'), 2000);
    })
    .catch(error => {
      alert("Erreur lors de l'envoi des données.");
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.376 12.416L8.777 19.482c-.7.046-.137.078-.217.078-.133 0-.262-.053-.353-.146-.157-.148-.194-.368-.094-.558l3.53-6.39H5c-.202 0-.373-.116-.443-.3-.074-.181-.026-.385.116-.504l10.62-7.303c.094-.063.209-.095.323-.095.183 0 .341.084.437.232.094.147.105.333.026.49l-3.53 6.562h6.37c.204 0 .38.127.448.306.068.18.015.38-.12.495z"/>
        </svg>
        Try again
      `;
      submitBtn.classList.remove('active');
    });
});