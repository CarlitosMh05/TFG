<?php
session_start();
require_once '../../../../db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}
$usuario_id = $_SESSION['user_id'];
$nombre = trim($_POST['valor'] ?? '');

if (!$nombre) {
    echo json_encode(['success' => false, 'error' => 'El nombre no puede estar vacío']);
    exit;
}
$sql = "UPDATE usuarios SET nombre = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $nombre, $usuario_id);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'nombre' => $nombre]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
?>
