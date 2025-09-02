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
  $stmt = $mysqli->prepare("SELECT cuenta, efectivo, moneda FROM usuarios WHERE id = ? LIMIT 1");
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
  $field = $_POST['field'] ?? '';
  $value = isset($_POST['value']) ? floatval($_POST['value']) : null;

  if ($value === null || $value < 0) {
    echo json_encode(['error' => 'Cantidad inválida']);
    exit;
  }

  // Primero vemos si el usuario tiene efectivo separado o no
  $current = getUserMoney($mysqli, $userId);
  if (!$current) { echo json_encode(['error' => 'Usuario no encontrado']); exit; }

  $efectivoIsNull = is_null($current['efectivo']);

  // Actualizaciones permitidas
  if ($efectivoIsNull) {
    // Solo una columna: se actualiza 'total' => mapeamos a 'cuenta' y dejamos 'efectivo' = NULL
    if ($field !== 'total') {
      echo json_encode(['error' => 'Campo no permitido']); exit;
    }
    $stmt = $mysqli->prepare("UPDATE usuarios SET cuenta = ?, efectivo = NULL WHERE id = ?");
    $stmt->bind_param('di', $value, $userId);
  } else {
    // Dos columnas: cuenta o efectivo
    if ($field !== 'cuenta' && $field !== 'efectivo') {
      echo json_encode(['error' => 'Campo no permitido']); exit;
    }
    $sql = "UPDATE usuarios SET {$field} = ? WHERE id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('di', $value, $userId);
  }

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
