<?php
require_once '../../db.php';

// Verificar si la tabla 'usuarios' existe
$table_exists = $conn->query("SHOW TABLES LIKE 'usuarios'");

if ($table_exists->num_rows == 0) {
    // Crear la tabla si no existe
    $sql = "CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        telefono VARCHAR(15),
        cuenta DECIMAL(10,2) DEFAULT 0,
        efectivo DECIMAL(10,2) NULL
    ) ENGINE=InnoDB;";

    if (!($conn->query($sql) === TRUE))
    {
        echo json_encode(['error' => 'Error al crear la base de datos']);
    } 
} 

$email = $_POST['email'] ?? '';
// Evita inyección básica
$email = $conn->real_escape_string($email);

$result = $conn->query("SELECT 1 FROM usuarios WHERE correo = '$email'");
echo json_encode([
  'exists' => ($result && $result->num_rows > 0)
]);
$conn->close();

?>