<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once '../../db.php';

// 1) Usuarios (ya estaba)
$table_exists = $conn->query("SHOW TABLES LIKE 'usuarios'");
if ($table_exists->num_rows == 0) {
    $sql = "CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        telefono VARCHAR(15),
        cuenta DECIMAL(10,2) DEFAULT 0,
        efectivo DECIMAL(10,2) NULL
    ) ENGINE=InnoDB;";
    if (!$conn->query($sql)) {
        echo json_encode(['error' => 'Error al crear la tabla usuarios']);
        exit;
    }
}

// 2) Conceptos
$sql = "CREATE TABLE IF NOT EXISTS conceptos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        es_ingreso BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;";
if (!$conn->query($sql)) {
    echo json_encode(['error' => 'Error al crear la tabla conceptos']);
    exit;
}

// 3) Etiquetas
$sql = "
CREATE TABLE IF NOT EXISTS etiquetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
";
if (!$conn->query($sql)) {
    echo json_encode(['error' => 'Error al crear la tabla etiquetas']);
    exit;
}

// Recogemos POST
$email      = $conn->real_escape_string($_POST['email']);
$contraseña = password_hash($_POST['contraseña'], PASSWORD_BCRYPT);
$nombre     = $conn->real_escape_string($_POST['nombre']);
$telefono   = $conn->real_escape_string($_POST['telefono']);
$cuenta = floatval($_POST['cuenta']);
$efectivo = $_POST['efectivo'];

// Verifica email duplicado
$res = $conn->query("SELECT 1 FROM usuarios WHERE correo = '$email'");
if ($res->num_rows > 0) {
    echo json_encode([
      'alredyEmail' => 'El correo ya está en uso. <a href="../InicioSesion/inicioSesion.html?email='
        . urlencode($email) . '">Iniciar sesión</a>'
    ]);
    exit;
}

// Inserta usuario
$sql = "
  INSERT INTO usuarios
    (nombre, correo, contrasena, telefono, cuenta, efectivo)
  VALUES
    ('$nombre', '$email', '$contraseña', '$telefono', $cuenta, $efectivo)
";
if ($conn->query($sql) !== TRUE) {
    echo json_encode(['error' => 'Error al crear el usuario.']);
    exit;
}

// ID del nuevo usuario
$newUserId = $conn->insert_id;

// Establecer la sesión
$_SESSION['user_id'] = $newUserId;


$conceptos = [
    ['Comida', 0],
    ['Gasolina', 0],
    ['Ocio', 0],
    ['Otros', 0],
    ['Salario', 1],
    ['Regalo', 1],
    ['Inversiones', 1],
    ['Otros', 1]
];

$stmt = $conn->prepare("INSERT INTO conceptos (user_id, nombre, es_ingreso) VALUES (?, ?, ?)");
$stmt->bind_param("isi", $newUserId, $nombreConcepto, $tipoIngreso);

foreach ($conceptos as [$nombreConcepto, $tipoIngreso]) {
    $stmt->execute();
}

$stmt->close();


// Éxito
echo json_encode(['loginExitoso' => "Usuario creado correctamente."]);

$conn->close();
?>
