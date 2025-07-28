<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();

require_once '../../db.php'; // Incluye la conexión asegurada

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

// Obtener los datos enviados por AJAX
$email = $_POST['email'];
$contraseña = $_POST['contraseña'];

// Consultar los puntos y los datos del usuario
$stmt = $conn->prepare("SELECT id, contrasena FROM usuarios WHERE correo = '$email'");
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) 
{

    $data = $result->fetch_assoc();

    if (empty($data['contrasena'])) {
        echo json_encode(['googleOnly' => 'Este correo está vinculado a una cuenta de Google. Inicia sesión con Google.']);
        exit;
    }


    if((password_verify($contraseña, $data['contrasena'])))
    {
        $_SESSION['user_id'] = $data['id'];
        echo json_encode([
            'loginExitoso' => "Contraseña correcta.",
        ]);
    }
    else
    {
        echo json_encode(['badPwd' => 'Contraseña incorrecta.']);
    }
    
} 
else 
{
    echo json_encode(['noEmail' => 'Este email no esta en nuestra base de datos. Quieres <a href="../CrearCuenta/crearCuenta.html"> crear una cuenta</a>']);
}

// Cerrar conexión
$conn->close();
?>
