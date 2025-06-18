<?php
require_once '../../auth.php'; // Ajusta rutas según tu estructura
require_once '../../db.php';

header('Content-Type: application/json');

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

// 1. Comprobar que es del usuario
$stmt = $conn->prepare("SELECT imagen FROM movimientos WHERE id=? AND user_id=?");
$stmt->bind_param('ii', $id, $uid);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows !== 1) {
    echo json_encode(['success' => false, 'error' => 'No encontrado']);
    exit;
}
$row = $res->fetch_assoc();

// 2. Borrar imagen física si la hay
if ($row['imagen'] && file_exists("../../" . $row['imagen'])) {
    @unlink("../../" . $row['imagen']);
}

// 3. Borrar etiquetas relacionadas
$conn->query("DELETE FROM movimiento_etiqueta WHERE movimiento_id = $id");

// 4. Borrar movimiento
$stmt2 = $conn->prepare("DELETE FROM movimientos WHERE id=? AND user_id=?");
$stmt2->bind_param('ii', $id, $uid);
$stmt2->execute();

if ($stmt2->affected_rows > 0) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'No se pudo borrar el movimiento']);
}
exit;
?>
