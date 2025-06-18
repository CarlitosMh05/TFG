<?php
require_once "../../../../auth.php";
require_once "../../../../db.php";

header('Content-Type: application/json');

$userId = $_SESSION['user_id'];
$nombre = trim($_POST['nombre'] ?? '');
$tipo   = isset($_POST['tipo']) ? intval($_POST['tipo']) : 0;

if ($nombre === '') {
    echo json_encode(['success' => false, 'error' => 'El nombre no puede estar vacío']);
    exit;
}

// Verificar si ya existe para ese usuario
$stmt = $conn->prepare("SELECT id FROM conceptos WHERE user_id = ? AND nombre = ? AND es_ingreso = ?");
$stmt->bind_param("isi", $userId, $nombre, $tipo);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    $tipoMsg = $tipo ? "ingreso" : "gasto";
    echo json_encode(['success' => false, 'alredyExists' => "El concepto de $tipoMsg «{$nombre}» ya existe"]);
    exit;
}
$stmt->close();

// Insertar nuevo concepto con tipo (es_ingreso)
$stmt = $conn->prepare("INSERT INTO conceptos (user_id, nombre, es_ingreso) VALUES (?, ?, ?)");
$stmt->bind_param("isi", $userId, $nombre, $tipo);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'nombre' => $nombre]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al insertar']);
}
$stmt->close();
?>
