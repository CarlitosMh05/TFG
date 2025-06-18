<?php
require_once '../../auth.php';   // O la ruta correcta a tu sistema de sesiones
require_once '../../db.php';     // O la ruta correcta a tu conexión PDO/MySQLi

header('Content-Type: application/json');

// 1. Comprobar sesión y recibir datos
$uid = $_SESSION['user_id'] ?? null;
if (!$uid) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$cantidad = floatval($_POST['cantidad'] ?? 0);
$moneda = trim($_POST['moneda'] ?? 'EUR');
$concepto = trim($_POST['concepto'] ?? '');
$observaciones = trim($_POST['observaciones'] ?? '');
$etiquetas = trim($_POST['etiquetas'] ?? '');

// Validación básica
$errores = [];
if (!$id) $errores['id'] = "ID inválido";
if (!$cantidad && $cantidad !== 0) $errores['cantidad'] = "Introduce una cantidad";
if (!$concepto) $errores['concepto'] = "Selecciona un concepto";
if (!$moneda) $errores['moneda'] = "Moneda requerida";
if (!empty($errores)) {
    echo json_encode(['success' => false, 'errors' => $errores]);
    exit;
}

// 2. Comprobar que el movimiento es del usuario
$stmt = $conn->prepare("SELECT * FROM movimientos WHERE id=? AND user_id=? LIMIT 1");
$stmt->bind_param('ii', $id, $uid);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows !== 1) {
    echo json_encode(['success' => false, 'error' => 'Movimiento no encontrado']);
    exit;
}
$mov = $res->fetch_assoc();

// 3. Buscar el ID del concepto (el usuario manda el nombre)
$stmtC = $conn->prepare("SELECT id FROM conceptos WHERE nombre=? AND user_id=? LIMIT 1");
$stmtC->bind_param('si', $concepto, $uid);
$stmtC->execute();
$resC = $stmtC->get_result();
if ($resC->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Concepto no válido']);
    exit;
}
$rowC = $resC->fetch_assoc();
$concepto_id = $rowC['id'];

// 4. Procesar imagen (si la hay)
$nuevaImagen = $mov['imagen'];
if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['imagen'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $permitidas = ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($ext, $permitidas)) {
        echo json_encode(['success' => false, 'error' => 'Tipo de imagen no permitido']);
        exit;
    }
    $nombreFinal = "mov_{$id}_" . time() . "." . $ext;
    $ruta = "uploads/$nombreFinal";
    if (!move_uploaded_file($file['tmp_name'], $ruta)) {
        echo json_encode(['success' => false, 'error' => 'Error al subir la imagen']);
        exit;
    }
    // Si hay imagen anterior, eliminarla
    if ($mov['imagen'] && file_exists("../../" . $mov['imagen'])) {
        @unlink("../../" . $mov['imagen']);
    }
    $nuevaImagen = "uploads/$nombreFinal";
}

// 5. Actualizar el movimiento
$stmt = $conn->prepare("UPDATE movimientos SET cantidad=?, moneda=?, concepto_id=?, observaciones=?, imagen=? WHERE id=? AND user_id=?");
$stmt->bind_param('dsdssii', $cantidad, $moneda, $concepto_id, $observaciones, $nuevaImagen, $id, $uid);
$stmt->execute();

if ($stmt->affected_rows < 0) {
    echo json_encode(['success' => false, 'error' => 'No se pudo actualizar']);
    exit;
}

// 6. Actualizar etiquetas (tabla movimiento_etiqueta)
// Primero, borrar las etiquetas anteriores
$conn->query("DELETE FROM movimiento_etiqueta WHERE movimiento_id = $id");
// Ahora, añadir las nuevas (si hay)
if ($etiquetas !== '') {
    $lista = array_filter(array_map('trim', explode(',', $etiquetas)));
    foreach ($lista as $etiqueta) {
        // Buscar el ID de la etiqueta para este usuario
        $stmtE = $conn->prepare("SELECT id FROM etiquetas WHERE nombre=? AND user_id=? LIMIT 1");
        $stmtE->bind_param('si', $etiqueta, $uid);
        $stmtE->execute();
        $resE = $stmtE->get_result();
        if ($resE->num_rows === 1) {
            $rowE = $resE->fetch_assoc();
            $eid = $rowE['id'];
            $conn->query("INSERT INTO movimiento_etiqueta (movimiento_id, etiqueta_id) VALUES ($id, $eid)");
        }
    }
}

// 7. Devolver respuesta OK
echo json_encode(['success' => true]);
exit;
?>
