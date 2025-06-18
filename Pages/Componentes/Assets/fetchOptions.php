<?php
require_once "../../../auth.php";
require_once "../../../db.php";

header('Content-Type: application/json');

$userId = $_SESSION['user_id'];
$tipo = $_GET['tipo'] ?? null;

$response = [];
$conceptos = [];
$etiquetas = [];

// Conceptos
if ($tipo === 'ingreso') {
    $stmt = $conn->prepare("SELECT id, nombre FROM conceptos WHERE user_id = ? AND es_ingreso = 1 ORDER BY nombre ASC");
} elseif ($tipo === 'gasto') {
    $stmt = $conn->prepare("SELECT id, nombre FROM conceptos WHERE user_id = ? AND es_ingreso = 0 ORDER BY nombre ASC");
} else {
    $stmt = $conn->prepare("SELECT id, nombre FROM conceptos WHERE user_id = ? ORDER BY nombre ASC");
}
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $conceptos[] = [
        'id' => $row['id'],
        'nombre' => $row['nombre'],
    ];
}

$response['conceptos'] = $conceptos;

$stmt->close();

// Etiquetas
$stmt = $conn->prepare("SELECT id,nombre FROM etiquetas WHERE user_id = ? ORDER BY nombre ASC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $etiquetas[] = [
        'id' => $row['id'],
        'nombre' => $row['nombre'],
    ];
}
$response['etiquetas'] = $etiquetas;

$stmt->close();

echo json_encode($response);
?>
