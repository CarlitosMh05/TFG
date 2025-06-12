<?php
require_once '../../auth.php';
require_once '../../db.php';
require_once 'vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit('Unauthorized');
}

$uid = $_SESSION['user_id'];
$formato = isset($_GET['formato']) ? $_GET['formato'] : 'csv';

// 1. Obtener movimientos con conceptos y etiquetas
$sql = "SELECT m.id, m.cantidad, m.moneda, c.nombre as concepto, m.observaciones, m.fecha_elegida, m.dia_recurrente, m.frecuencia
        FROM movimientos m
        JOIN conceptos c ON c.id = m.concepto_id
        WHERE m.user_id = $uid
        ORDER BY m.fecha_elegida DESC, m.id DESC";
$res = $conn->query($sql);

$movs = [];
while ($row = $res->fetch_assoc()) {
    // Etiquetas (pueden ser varias)
    $mid = $row['id'];
    $etiquetas = [];
    $q2 = $conn->query("SELECT e.nombre FROM movimiento_etiqueta me JOIN etiquetas e ON e.id = me.etiqueta_id WHERE me.movimiento_id = $mid");
    while ($etq = $q2->fetch_assoc()) {
        $etiquetas[] = $etq['nombre'];
    }
    $row['etiquetas'] = implode(', ', $etiquetas);
    $movs[] = $row;
}

// --- CSV ---
if ($formato === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="movimientos.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Cantidad', 'Moneda', 'Concepto', 'Observaciones', 'Fecha', 'Día recurrente', 'Frecuencia', 'Etiquetas']);
    foreach ($movs as $mov) {
        fputcsv($output, [
            $mov['cantidad'], $mov['moneda'], $mov['concepto'], $mov['observaciones'], $mov['fecha_elegida'],
            $mov['dia_recurrente'], $mov['frecuencia'], $mov['etiquetas']
        ]);
    }
    fclose($output);
    exit;
}

// --- EXCEL (.xlsx) ---
if ($formato === 'excel' || $formato === 'xlsx') {
    require_once 'vendor/autoload.php'; // Composer: phpoffice/phpspreadsheet
    
    $spreadsheet = new Spreadsheet();
    $writer = new Xlsx($spreadsheet);
    
    $sheet = $spreadsheet->getActiveSheet();

    $sheet->fromArray(['Cantidad', 'Moneda', 'Concepto', 'Observaciones', 'Fecha', 'Día recurrente', 'Frecuencia', 'Etiquetas'], null, 'A1');
    $i = 2;
    foreach ($movs as $mov) {
        $sheet->fromArray([
            $mov['cantidad'], $mov['moneda'], $mov['concepto'], $mov['observaciones'], $mov['fecha_elegida'],
            $mov['dia_recurrente'], $mov['frecuencia'], $mov['etiquetas']
        ], null, "A$i");
        $i++;
    }

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="movimientos.xlsx"');
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;
}

// --- PDF ---
if ($formato === 'pdf') {
    require_once __DIR__ . 'vendor/autoload.php'; // Composer: mpdf/mpdf

    $html = '<h2>Movimientos</h2><table border="1" cellpadding="4" cellspacing="0"><thead>
    <tr><th>Cantidad</th><th>Moneda</th><th>Concepto</th><th>Observaciones</th><th>Fecha</th>
    <th>Día recurrente</th><th>Frecuencia</th><th>Etiquetas</th></tr></thead><tbody>';
    foreach ($movs as $mov) {
        $html .= '<tr>';
        foreach (['cantidad','moneda','concepto','observaciones','fecha_elegida','dia_recurrente','frecuencia','etiquetas'] as $campo) {
            $html .= '<td>' . htmlspecialchars($mov[$campo] ?? '') . '</td>';
        }
        $html .= '</tr>';
    }
    $html .= '</tbody></table>';

    $mpdf = new \Mpdf\Mpdf(['tempDir' => __DIR__ . '/tmp']); // tmp dir para servidores limitados
    $mpdf->WriteHTML($html);
    $mpdf->Output('movimientos.pdf', 'D');
    exit;
}

echo 'Formato no soportado';
