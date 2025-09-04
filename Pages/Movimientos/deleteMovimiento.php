<?php
// deleteMovimiento.php
session_start();
header('Content-Type: application/json');

require_once '../../db.php'; // ajusta ruta si aplica

if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autorizado']);
  exit;
}
$userId = (int)$_SESSION['user_id'];

$mysqli = $conn ?? new mysqli($servername, $username, $password, $dbname);
if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(['error' => 'DB error']);
  exit;
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'ID inválido']);
  exit;
}

$mysqli->begin_transaction();
try {
  // 1) Obtener el movimiento
  $stmt = $mysqli->prepare("SELECT cantidad, tipo_pago FROM movimientos WHERE id = ? AND user_id = ? LIMIT 1");
  $stmt->bind_param('ii', $id, $userId);
  $stmt->execute();
  $mov = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  if (!$mov) {
    throw new Exception('Movimiento no encontrado');
  }

  // 2) Quitar su efecto de usuarios
  $cant = (float)$mov['cantidad'];
  $tipo = $mov['tipo_pago'];

  if ($tipo === 'cuenta') {
    $stmt = $mysqli->prepare("UPDATE usuarios SET cuenta = cuenta - ? WHERE id = ? LIMIT 1");
    $stmt->bind_param('di', $cant, $userId);
    $stmt->execute();
    $stmt->close();
  } else if ($tipo === 'efectivo') {
    $stmt = $mysqli->prepare("UPDATE usuarios SET efectivo = efectivo - ? WHERE id = ? LIMIT 1");
    $stmt->bind_param('di', $cant, $userId);
    $stmt->execute();
    $stmt->close();
  } else {
    // otras cuentas futuras -> por ahora no tocamos totales
  }

  // 3) Borrar
  $stmt = $mysqli->prepare("DELETE FROM movimientos WHERE id = ? AND user_id = ? LIMIT 1");
  $stmt->bind_param('ii', $id, $userId);
  $stmt->execute();
  if ($stmt->affected_rows < 1) {
    throw new Exception('No se pudo borrar');
  }
  $stmt->close();

  $mysqli->commit();
  echo json_encode(['success' => true, 'id' => $id]);

} catch (Exception $e) {
  $mysqli->rollback();
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
}
