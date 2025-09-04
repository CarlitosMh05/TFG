<?php
require_once '../../auth.php';
require_once '../../db.php';

header('Content-Type: application/json');
$uid = $_SESSION['user_id'] ?? null;
if (!$uid) die(json_encode(['success'=>false, 'error'=>'No login']));

// Filtros
$concepto = isset($_GET['concepto_id']) && $_GET['concepto_id'] !== "" ? intval($_GET['concepto_id']) : null;
$etiqueta = isset($_GET['etiqueta_id']) && $_GET['etiqueta_id'] !== "" ? intval($_GET['etiqueta_id']) : null;
$fecha_inicio = $_GET['fecha_inicio'] ?? null;
$fecha_fin = $_GET['fecha_fin'] ?? null;

// Scroll infinito: paginación
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;

// SQL base
$sql = "SELECT m.id, m.cantidad, m.moneda, m.observaciones, m.created_at, m.fecha_elegida,m.imagen, m.tipo_pago, c.nombre as concepto
        FROM movimientos m
        JOIN conceptos c ON c.id = m.concepto_id
        WHERE m.user_id = ?";
$params = [$uid];

// Filtros
if ($concepto) {
    $sql .= " AND m.concepto_id = ?";
    $params[] = $concepto;
}
if ($fecha_inicio) {
    $sql .= " AND DATE(COALESCE(m.fecha_elegida, m.created_at)) >= ?";
    $params[] = $fecha_inicio;
}
if ($fecha_fin) {
    $sql .= " AND DATE(COALESCE(m.fecha_elegida, m.created_at)) <= ?";
    $params[] = $fecha_fin;
}
if ($etiqueta) {
    $sql .= " AND EXISTS (
        SELECT 1 FROM movimiento_etiqueta me WHERE me.movimiento_id = m.id AND me.etiqueta_id = ?
    )";
    $params[] = $etiqueta;
}

$sql .= " ORDER BY m.fecha_elegida DESC, m.id DESC";


$stmt = $conn->prepare($sql);
$types = "i";
if ($concepto) $types .= "i";
if ($fecha_inicio) $types .= "s";
if ($fecha_fin) $types .= "s";
if ($etiqueta) $types .= "i";
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$movs = [];
$ids = [];
while ($row = $res->fetch_assoc()) {
    $movs[] = $row;
    $ids[] = $row['id'];
}

// Buscar etiquetas para todos los movimientos de este bloque
$etiquetas_map = [];
if (count($ids) > 0) {
    $in = implode(',', array_fill(0, count($ids), '?'));
    $stmt2 = $conn->prepare("SELECT me.movimiento_id, e.id, e.nombre FROM movimiento_etiqueta me JOIN etiquetas e ON me.etiqueta_id = e.id WHERE me.movimiento_id IN ($in)");
    $stmt2->bind_param(str_repeat('i', count($ids)), ...$ids);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    while ($r = $res2->fetch_assoc()) {
        $mid = $r['movimiento_id'];
        if (!isset($etiquetas_map[$mid])) $etiquetas_map[$mid] = [];
        $etiquetas_map[$mid][] = ['id'=>$r['id'], 'nombre'=>$r['nombre']];
    }
}

// Agrupa por día (clave: Y-m-d)
$result = [];
foreach ($movs as $mov) {
    $fecha = $mov['fecha_elegida'] ?: substr($mov['created_at'],0,10);
    if (!isset($result[$fecha])) $result[$fecha] = [];
    $mov['etiquetas'] = $etiquetas_map[$mov['id']] ?? [];
    $result[$fecha][] = $mov;
}

// Ordenar días descendente
krsort($result);

echo json_encode([
    'success'=>true,
    'data'=>$result,
    'total'=>count($movs)
]);
