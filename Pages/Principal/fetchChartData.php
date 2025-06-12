<?php
// Ya inicia sesión en auth.php, así evitamos session_start() duplicado
require_once '../../auth.php';
require_once '../../db.php';

header('Content-Type: application/json; charset=utf-8');

// 1) Parámetros de entrada
$startStr   = $_GET['start']      ?? '';
$endStr     = $_GET['end']        ?? '';
$frecuencia = $_GET['frecuencia'] ?? 'mensual';
$userId     = $_SESSION['user_id'];
$etiquetaId = isset($_GET['etiqueta_id']) && $_GET['etiqueta_id'] !== '' ? $_GET['etiqueta_id'] : null;

// 2) Estructuras iniciales
$expense = ['labels'=>[], 'data'=>[], 'total'=>0, 'rawTotal'=>0];
$income  = ['labels'=>[], 'data'=>[], 'total'=>0];

// 3) INGRESOS: cantidad >= 0
$sqlIngreso = "
    SELECT c.nombre AS concepto, SUM(m.cantidad) AS suma
    FROM movimientos m
    JOIN conceptos c ON m.concepto_id = c.id
";
if ($etiquetaId !== null) {
    $sqlIngreso .= " JOIN movimiento_etiqueta me ON m.id = me.movimiento_id ";
}
$sqlIngreso .= " WHERE m.user_id = ?
      AND m.cantidad >= 0
      AND DATE(COALESCE(m.fecha_elegida, m.created_at)) BETWEEN ? AND ?
";
if ($etiquetaId !== null) {
    $sqlIngreso .= " AND me.etiqueta_id = ?";
}
$sqlIngreso .= " GROUP BY c.nombre";

$paramsIngreso = [$userId, $startStr, $endStr];
$typesIngreso = "iss";
if ($etiquetaId !== null) {
    $paramsIngreso[] = $etiquetaId;
    $typesIngreso .= "i";
}

$stmt = $conn->prepare($sqlIngreso);
$stmt->bind_param($typesIngreso, ...$paramsIngreso);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
    $income['labels'][] = $row['concepto'];
    $income['data'][]   = (float)$row['suma'];
    $income['total']   += (float)$row['suma'];
}
$stmt->close();

// 4) GASTOS: cantidad < 0
$sqlGasto = "
    SELECT c.nombre AS concepto, SUM(ABS(m.cantidad)) AS suma
    FROM movimientos m
    JOIN conceptos c ON m.concepto_id = c.id
";
if ($etiquetaId !== null) {
    $sqlGasto .= " JOIN movimiento_etiqueta me ON m.id = me.movimiento_id ";
}
$sqlGasto .= " WHERE m.user_id = ?
      AND m.cantidad < 0
      AND DATE(COALESCE(m.fecha_elegida, m.created_at)) BETWEEN ? AND ?
";
if ($etiquetaId !== null) {
    $sqlGasto .= " AND me.etiqueta_id = ?";
}
$sqlGasto .= " GROUP BY c.nombre";

$paramsGasto = [$userId, $startStr, $endStr];
$typesGasto = "iss";
if ($etiquetaId !== null) {
    $paramsGasto[] = $etiquetaId;
    $typesGasto .= "i";
}

$stmt = $conn->prepare($sqlGasto);
$stmt->bind_param($typesGasto, ...$paramsGasto);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
    $expense['labels'][]  = $row['concepto'];
    $expense['data'][]    = (float)$row['suma'];
    $expense['total']    += (float)$row['suma'];
}
$stmt->close();

// rawTotal guarda el signo negativo para el cálculo neto
$expense['rawTotal'] = - $expense['total'];

// 5) ¿El usuario tiene **algún** movimiento en total?
$sqlHasAny = "
    SELECT COUNT(*) AS total
    FROM movimientos m
";
if ($etiquetaId !== null) {
    $sqlHasAny .= " JOIN movimiento_etiqueta me ON m.id = me.movimiento_id ";
}
$sqlHasAny .= " WHERE m.user_id = ?";
if ($etiquetaId !== null) {
    $sqlHasAny .= " AND me.etiqueta_id = ?";
}
$paramsHasAny = [$userId];
$typesHasAny = "i";
if ($etiquetaId !== null) {
    $paramsHasAny[] = $etiquetaId;
    $typesHasAny .= "i";
}
$stmt = $conn->prepare($sqlHasAny);
$stmt->bind_param($typesHasAny, ...$paramsHasAny);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$hasAnyMovements = ($row['total'] ?? 0) > 0;
$stmt->close();

// 6) Datos para la tendencia (gráfico de barras)
$trendGroup = $_GET['trendGroup'] ?? $frecuencia;
switch (strtolower($trendGroup)) {
    case 'diaria':
    case 'semanal':
    case 'mensual':
        // Día a día
        $groupExpr = "DATE_FORMAT(COALESCE(fecha_elegida, created_at), '%Y-%m-%d')";
        break;

    case 'trimestral':
    case 'anual':
        // Mes a mes (en el trimestre o en el año completo)
        $groupExpr = "DATE_FORMAT(COALESCE(fecha_elegida, created_at), '%Y-%m')";
        break;

    default:
        // Por defecto día a día
        $groupExpr = "DATE_FORMAT(COALESCE(fecha_elegida, created_at), '%Y-%m-%d')";
        break;
}

$trend = ['labels'=>[], 'data'=>[]];
$sqlTrend = "
    SELECT
      $groupExpr AS periodo,
      SUM(m.cantidad) AS total
    FROM movimientos m
";
if ($etiquetaId !== null) {
    $sqlTrend .= " JOIN movimiento_etiqueta me ON m.id = me.movimiento_id ";
}
$sqlTrend .= " WHERE m.user_id = ?
      AND DATE(COALESCE(m.fecha_elegida, m.created_at)) BETWEEN ? AND ?
";
if ($etiquetaId !== null) {
    $sqlTrend .= " AND me.etiqueta_id = ?";
}
$sqlTrend .= " GROUP BY periodo
    ORDER BY periodo";

$paramsTrend = [$userId, $startStr, $endStr];
$typesTrend = "iss";
if ($etiquetaId !== null) {
    $paramsTrend[] = $etiquetaId;
    $typesTrend .= "i";
}

$stmt = $conn->prepare($sqlTrend);
$stmt->bind_param($typesTrend, ...$paramsTrend);
$stmt->execute();
$res = $stmt->get_result();
while ($r = $res->fetch_assoc()) {
    $trend['labels'][] = $r['periodo'];
    $trend['data'][]   = (float)$r['total'];
}
$stmt->close();

// 7) Devolver todo en JSON
echo json_encode([
    'expense'          => $expense,
    'income'           => $income,
    'hasAnyMovements'  => $hasAnyMovements,
    'trend'            => $trend
]);
exit;
?>
