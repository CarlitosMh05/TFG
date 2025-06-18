<?php
session_start();
require_once '../../../../db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}
$usuario_id = $_SESSION['user_id'];
$telefono = trim($_POST['valor'] ?? '');

if (!$telefono) {
    echo json_encode(['success' => false, 'error' => 'El teléfono no puede estar vacío']);
    exit;
}
$sql = "UPDATE usuarios SET telefono = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $telefono, $usuario_id);
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
?>
