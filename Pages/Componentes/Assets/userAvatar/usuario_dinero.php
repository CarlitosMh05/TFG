<?php
// /ajax/usuario_dinero.php
session_start();
header('Content-Type: application/json');

require_once '../../../../db.php'; // AJUSTA la ruta

// Asumo que tienes $_SESSION['user_id'] ya seteada:
if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autorizado']);
  exit;
}
$userId = $_SESSION['user_id'];

$mysqli = $conn ?? new mysqli($servername, $username, $password, $dbname);
if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(['error' => 'DB error']);
  exit;
}

$action = $_REQUEST['action'] ?? 'get';

function getUserMoney($mysqli, $userId) {
  $stmt = $mysqli->prepare("SELECT cuenta, efectivo FROM usuarios WHERE id = ? LIMIT 1");
  $stmt->bind_param('i', $userId);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res->fetch_assoc();
  $stmt->close();

  if (!$row) return null;

  // Normalizamos null
  $cuenta = is_null($row['cuenta']) ? 0.0 : floatval($row['cuenta']);
  $efectivo = (is_null($row['efectivo']) ? null : floatval($row['efectivo']));
  $moneda = $row['moneda'] ?? 'EUR';

  return ['cuenta' => $cuenta, 'efectivo' => $efectivo, 'moneda' => $moneda];
}

if ($action === 'get') {
  $data = getUserMoney($mysqli, $userId);
  if (!$data) { echo json_encode(['error' => 'Usuario no encontrado']); exit; }
  echo json_encode($data);
  exit;
}

if ($action === 'update') {

  $field = $_POST['campo'] ?? '';
  $valor = isset($_POST['valor']) ? floatval($_POST['valor']) : null;
  if ($valor === null || $valor < 0) {
    echo json_encode(['error' => 'Cantidad inválida']);
    exit;
  }

  // Dos columnas: cuenta o efectivo
  if ($field !== 'cuenta' && $field !== 'efectivo') {
    echo json_encode(['error' => 'Campo no permitido']); exit;
  }
  $sql = "UPDATE usuarios SET {$field} = ? WHERE id = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('si', $value, $userId);
  echo($stmt);

  if (!$stmt->execute()) {
    echo json_encode(['error' => 'No se pudo actualizar']);
    $stmt->close();
    exit;
  }
  $stmt->close();

  // Devolvemos los valores actualizados
  $data = getUserMoney($mysqli, $userId);
  echo json_encode($data);
  exit;
}

echo json_encode(['error' => 'Acción no válida']);
