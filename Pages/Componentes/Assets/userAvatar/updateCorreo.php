<?php
session_start();
require_once '../../../../db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}
$usuario_id = $_SESSION['user_id'];
$correo = trim($_POST['valor'] ?? '');

if (!$correo || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Correo inválido']);
    exit;
}
$sql = "UPDATE usuarios SET correo = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $correo, $usuario_id);
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
?>
