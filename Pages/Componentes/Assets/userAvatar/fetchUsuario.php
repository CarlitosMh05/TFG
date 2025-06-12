<?php
session_start();
require_once '../../../../db.php'; // Ajusta la ruta si no está en la raíz

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'No hay sesión activa']);
    exit;
}

$usuario_id = $_SESSION['user_id'];
$sql = "SELECT id, nombre, correo, telefono FROM usuarios WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'success' => true,
        'usuario' => $row
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
}
?>
