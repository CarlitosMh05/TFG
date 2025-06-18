<?php
require_once '../../auth.php';
require_once '../../db.php';

header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}
$uid = $_SESSION['user_id'];

// --- Leer archivo (csv o excel) ---
if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== 0) {
    echo json_encode(['success' => false, 'error' => 'Archivo no recibido']);
    exit;
}

$ext = strtolower(pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION));
$data = [];

if ($ext === 'csv') {
    $handle = fopen($_FILES['archivo']['tmp_name'], 'r');
    $headers = array_map('strtolower', array_map('trim', fgetcsv($handle)));
    while (($row = fgetcsv($handle)) !== false) {
        $fila = [];
        foreach ($headers as $i => $col) $fila[$col] = $row[$i] ?? '';
        $data[] = $fila;
    }
    fclose($handle);
} else if ($ext === 'xlsx' || $ext === 'xls') {
    require_once __DIR__ . '/vendor/autoload.php';
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($_FILES['archivo']['tmp_name']);
    $sheet = $spreadsheet->getActiveSheet();
    $headers = [];
    foreach ($sheet->getRowIterator() as $i => $row) {
        $cells = [];
        foreach ($row->getCellIterator() as $cell) $cells[] = $cell->getValue();
        if ($i == 1) {
            $headers = array_map(
                function($cell) { return strtolower(trim((string)$cell)); },
                $cells
            );
        } else {
            $fila = [];
            foreach ($headers as $j => $col) $fila[$col] = $cells[$j] ?? '';
            $data[] = $fila;
        }
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Formato de archivo no soportado']);
    exit;
}

// Campos posibles, soporta español e inglés
$map = [
    'cantidad' => ['cantidad','amount','valor','value','importe'],
    'moneda' => ['moneda','currency'],
    'concepto' => ['concepto','concept','Concepto'],
    'observaciones' => ['observaciones','notes','observations'],
    'fecha_elegida' => ['fecha','fecha_elegida','date','F. Valor'],
    'dia_recurrente' => ['dia_recurrente','recurring_day'],
    'frecuencia' => ['frecuencia','frequency'],
    'etiquetas' => ['etiquetas','tags','labels'],
];

// --- Importar filas ---
$nuevos = 0;
foreach ($data as $fila) {
    // Detectar columnas disponibles
    $val = [];
    foreach ($map as $colDB => $posibles) {
        foreach ($posibles as $header) {
            if (isset($fila[$header]) && $fila[$header] !== '') {
                $val[$colDB] = $fila[$header];
                break;
            }
        }
        if (!isset($val[$colDB])) $val[$colDB] = null;
    }
    // Campos mínimos: cantidad y concepto
    if ($val['cantidad'] === null || $val['concepto'] === null) continue;

    // Concepto (crear si no existe)
    $concepto = $conn->real_escape_string(trim($val['concepto']));
    $q = $conn->query("SELECT id FROM conceptos WHERE nombre = '$concepto' AND user_id = $uid");
    if ($q->num_rows === 0) {
        // Por defecto, si cantidad > 0, es ingreso, si no, gasto
        $es_ingreso = floatval($val['cantidad']) > 0 ? 1 : 0;
        $conn->query("INSERT INTO conceptos (user_id, nombre, es_ingreso) VALUES ($uid, '$concepto', $es_ingreso)");
        $concepto_id = $conn->insert_id;
    } else {
        $concepto_id = $q->fetch_assoc()['id'];
    }

    // Insertar movimiento
    $tipo_pago = 'cuenta';

    $stmt = $conn->prepare("INSERT INTO movimientos (user_id, cantidad, moneda, concepto_id, observaciones, tipo_pago, fecha_elegida, dia_recurrente, frecuencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $moneda = $val['moneda'] ?: 'EUR';
    $observaciones = $val['observaciones'] ?: null;
    $fecha = $val['fecha_elegida'] ?: date('Y-m-d');
    $dia_rec = $val['dia_recurrente'] ?: null;
    $frecuencia = $val['frecuencia'] ?: null;

    //                 uid,      cantidad,   moneda, concepto_id, obs,    tipo_pago, fecha,     dia_rec,   frecuencia
    $stmt->bind_param('idsssssss', $uid, $val['cantidad'], $moneda, $concepto_id, $observaciones, $tipo_pago, $fecha, $dia_rec, $frecuencia);

    $stmt->execute();
    $mov_id = $stmt->insert_id;
    $nuevos++;

    // Etiquetas (crear si no existen y asociar)
    if ($val['etiquetas']) {
        $etqs = preg_split('/[,;]+/', $val['etiquetas']);
        foreach ($etqs as $etq) {
            $etq = trim($etq);
            if ($etq === '') continue;
            $qe = $conn->query("SELECT id FROM etiquetas WHERE nombre = '$etq' AND user_id = $uid");
            if ($qe->num_rows === 0) {
                $conn->query("INSERT INTO etiquetas (user_id, nombre) VALUES ($uid, '$etq')");
                $eid = $conn->insert_id;
            } else {
                $eid = $qe->fetch_assoc()['id'];
            }
            $conn->query("INSERT IGNORE INTO movimiento_etiqueta (movimiento_id, etiqueta_id) VALUES ($mov_id, $eid)");
        }
    }
}

echo json_encode(['success' => true, 'nuevos' => $nuevos]);
