<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Usuario no autenticado']);
    exit;
}

require_once '../../../../db.php';
$userId = $_SESSION['user_id'];

// DEBUG: Mostrar ID del usuario
error_log("🧩 Obteniendo predeterminados para user_id: $userId");

// Obtener predeterminados
$stmt = $conn->prepare("SELECT concepto_ingreso_id, concepto_gasto_id, tipo_default FROM predeterminados WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$pred = $result->fetch_assoc();

// Obtener etiquetas predeterminadas
$stmt2 = $conn->prepare("SELECT etiqueta_id FROM etiqueta_predeterminada WHERE user_id = ?");
$stmt2->bind_param("i", $userId);
$stmt2->execute();
$result2 = $stmt2->get_result();

$etiquetas = [];
while ($row = $result2->fetch_assoc()) {
    $etid = (int)$row['etiqueta_id'];
    
    // Obtener el nombre de la etiqueta
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

// DEBUG: Imprimir resultados
error_log("🎯 Datos concepto: " . json_encode($pred));
error_log("🏷️ Etiquetas: " . json_encode($etiquetas));

echo json_encode([
    'success' => true,
    'concepto_ingreso_id' => $pred['concepto_ingreso_id'] ?? null,
    'concepto_gasto_id' => $pred['concepto_gasto_id'] ?? null,
    'tipo_default' => $pred['tipo_default'] ?? 'gasto',
    'etiquetas' => $etiquetas
]);
?>
