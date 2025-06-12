<?php
require_once '../../auth.php';   // Ajusta la ruta según tu estructura
require_once '../../db.php';     // Ajusta la ruta según tu estructura

header('Content-Type: application/json');

// 1. Comprobar sesión y recibir datos
$uid = $_SESSION['user_id'] ?? null;
if (!$uid) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID inválido']);
    exit;
}

// 2. Comprobar que el movimiento es del usuario y tiene imagen
$stmt = $conn->prepare("SELECT imagen FROM movimientos WHERE id=? AND user_id=? LIMIT 1");
$stmt->bind_param('ii', $id, $uid);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows !== 1) {
    echo json_encode(['success' => false, 'error' => 'Movimiento no encontrado']);
    exit;
}
$row = $res->fetch_assoc();
$imagen = $row['imagen'];

// 3. Borrar imagen del disco si existe
if ($imagen && file_exists("../../" . $imagen)) {
    @unlink("../../" . $imagen);
}

// 4. Eliminar referencia en la base de datos
$stmt2 = $conn->prepare("UPDATE movimientos SET imagen=NULL WHERE id=? AND user_id=?");
$stmt2->bind_param('ii', $id, $uid);
$stmt2->execute();

if ($stmt2->affected_rows < 0) {
    echo json_encode(['success' => false, 'error' => 'No se pudo actualizar el movimiento']);
    exit;
}

echo json_encode(['success' => true]);
exit;
?>
