<?php
// Connexion à la base de données
$servername = "localhost";
$username = "votre_utilisateur";
$password = "votre_mot_de_passe";
$dbname = "votre_base_de_donnees";

// Créer une connexion
$conn = new mysqli($servername, $username, $password, $dbname);

// Vérifier la connexion
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Récupérer les données du formulaire
$project_name = $_POST['projectName'];
$technician_name = $_POST['technicianName'];
$intervention_date = $_POST['datetime'];
$location = $_POST['location'];
$intervention_type = $_POST['interventionType'];
$problem_type = $_POST['problemType'];
$status = $_POST['status'];
$intervention_status = $_POST['interventionStatus'];
$comments = $_POST['comments'];

// Préparer et exécuter la requête SQL
$stmt = $conn->prepare("INSERT INTO Oussama (project_name, technician_name, intervention_date, location, intervention_type, problem_type, status, intervention_status, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssssss", $project_name, $technician_name, $intervention_date, $location, $intervention_type, $problem_type, $status, $intervention_status, $comments);

if ($stmt->execute()) {
    echo "Nouvel enregistrement créé avec succès";
} else {
    echo "Erreur: " . $stmt->error;
}

// Fermer la connexion
$stmt->close();
$conn->close();
?>
