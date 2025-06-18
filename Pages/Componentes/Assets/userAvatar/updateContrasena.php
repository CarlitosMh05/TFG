<?php
session_start();
require_once '../../../../db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}
$usuario_id = $_SESSION['user_id'];
$contrasena = $_POST['valor'] ?? '';

if (!$contrasena || strlen($contrasena) < 6) {
    echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}
// Hasheamos la contraseña antes de guardar
$contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

$sql = "UPDATE usuarios SET contrasena = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $contrasenaHash, $usuario_id);
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
?>
