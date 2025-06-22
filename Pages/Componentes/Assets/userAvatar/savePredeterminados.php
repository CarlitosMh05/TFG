<?php
// savePredeterminados.php
session_start();
require '../../../../db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$concepto_ingreso_id = $_POST['concepto_ingreso_id'] ?? null;
$concepto_gasto_id   = $_POST['concepto_gasto_id'] ?? null;
$tipo_default        = $_POST['tipo_default'] ?? 'gasto';
$etiquetas           = $_POST['etiquetas'] ?? [];

// Validaciones básicas
if (!in_array($tipo_default, ['ingreso', 'gasto'])) $tipo_default = 'gasto';

// Insertar o actualizar en predeterminados
$sql = "INSERT INTO predeterminados (user_id, concepto_ingreso_id, concepto_gasto_id, tipo_default)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE concepto_ingreso_id = VALUES(concepto_ingreso_id), concepto_gasto_id = VALUES(concepto_gasto_id), tipo_default = VALUES(tipo_default)";
$stmt = $conn->prepare($sql);


$stmt->bind_param('iiis', $user_id, $concepto_ingreso_id, $concepto_gasto_id, $tipo_default);


if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar preferencias']);
    exit;
}

// Limpiar etiquetas anteriores
$conn->query("DELETE FROM etiqueta_predeterminada WHERE user_id = $user_id");

// Insertar nuevas etiquetas
if (is_array($etiquetas)) {
    foreach ($etiquetas as $etid) {
        $etid = intval($etid);
        $conn->query("INSERT INTO etiqueta_predeterminada (user_id, etiqueta_id) VALUES ($user_id, $etid)");
    }
}

echo json_encode(['success' => true]);
