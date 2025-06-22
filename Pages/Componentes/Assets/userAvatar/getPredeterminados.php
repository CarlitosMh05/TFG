<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

require_once '../../../../db.php';
$userId = $_SESSION['user_id'];

error_log("🧩 Obteniendo predeterminados para user_id: $userId");

// Obtener predeterminados (IDs)
$stmt = $conn->prepare("SELECT concepto_ingreso_id, concepto_gasto_id, tipo_default FROM predeterminados WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$pred = $result->fetch_assoc();

// Inicializar nombres de conceptos
$conceptoIngresoNombre = null;
$conceptoGastoNombre = null;

// Obtener nombre del concepto de ingreso (si existe)
if (!empty($pred['concepto_ingreso_id'])) {
    $stmtIngreso = $conn->prepare("SELECT nombre FROM conceptos WHERE id = ?");
    $stmtIngreso->bind_param("i", $pred['concepto_ingreso_id']);
    $stmtIngreso->execute();
    $resIngreso = $stmtIngreso->get_result()->fetch_assoc();
    $conceptoIngresoNombre = $resIngreso['nombre'] ?? null;
}

// Obtener nombre del concepto de gasto (si existe)
if (!empty($pred['concepto_gasto_id'])) {
    $stmtGasto = $conn->prepare("SELECT nombre FROM conceptos WHERE id = ?");
    $stmtGasto->bind_param("i", $pred['concepto_gasto_id']);
    $stmtGasto->execute();
    $resGasto = $stmtGasto->get_result()->fetch_assoc();
    $conceptoGastoNombre = $resGasto['nombre'] ?? null;
}

// Obtener etiquetas predeterminadas
$stmt2 = $conn->prepare("SELECT etiqueta_id FROM etiqueta_predeterminada WHERE user_id = ?");
$stmt2->bind_param("i", $userId);
$stmt2->execute();
$result2 = $stmt2->get_result();

$etiquetas = [];
while ($row = $result2->fetch_assoc()) {
    $etid = (int)$row['etiqueta_id'];

    $etqStmt = $conn->prepare("SELECT nombre FROM etiquetas WHERE id = ?");
    $etqStmt->bind_param("i", $etid);
    $etqStmt->execute();
    $etqResult = $etqStmt->get_result();
    $etqRow = $etqResult->fetch_assoc();

    if ($etqRow) {
        $etiquetas[] = [
            'id' => $etid,
            'nombre' => $etqRow['nombre']
        ];
    }
}

error_log("🎯 Datos concepto: " . json_encode([
    'ingreso' => $conceptoIngresoNombre,
    'gasto' => $conceptoGastoNombre
]));
error_log("🏷️ Etiquetas: " . json_encode($etiquetas));

// Devolver nombres en lugar de IDs
echo json_encode([
    'success' => true,
    'concepto_ingreso_nombre' => $conceptoIngresoNombre,
    'concepto_gasto_nombre' => $conceptoGastoNombre,
    'tipo_default' => $pred['tipo_default'] ?? 'gasto',
    'etiquetas' => $etiquetas
]);
?>
