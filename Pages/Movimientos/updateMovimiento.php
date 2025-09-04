<?php
// updateMovimiento.php
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

// Campos esperados desde el fetch del front
$id            = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$cantidadNueva = isset($_POST['cantidad']) ? (float)$_POST['cantidad'] : null;
$conceptoId    = isset($_POST['concepto_id']) ? (int)$_POST['concepto_id'] : null;
$observaciones = isset($_POST['observaciones']) ? $_POST['observaciones'] : null;
$tipoPagoNuevo = isset($_POST['tipo_pago']) ? trim($_POST['tipo_pago']) : null; // p.ej. 'cuenta' o 'efectivo' (o futuras)
$fechaElegida  = isset($_POST['fecha_elegida']) ? $_POST['fecha_elegida'] : null;
$moneda        = isset($_POST['moneda']) ? $_POST['moneda'] : 'EUR'; // por ahora solo EUR

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'ID inválido']);
  exit;
}

$mysqli->begin_transaction();

try {
  // 1) Leer el movimiento original (para calcular -viejo +nuevo)
  $stmt = $mysqli->prepare("SELECT id, user_id, cantidad, tipo_pago FROM movimientos WHERE id = ? AND user_id = ? LIMIT 1");
  $stmt->bind_param('ii', $id, $userId);
  $stmt->execute();
  $orig = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  if (!$orig) {
    throw new Exception('Movimiento no encontrado');
  }

  $cantidadVieja = (float)$orig['cantidad'];
  $tipoPagoViejo = $orig['tipo_pago']; // no forzamos valores por tu requerimiento

  // 2) Quitar efecto del movimiento viejo en usuarios.(cuenta|efectivo)
  if ($tipoPagoViejo !== null && $tipoPagoViejo !== '') {
    if ($tipoPagoViejo === 'cuenta') {
      $stmt = $mysqli->prepare("UPDATE usuarios SET cuenta = cuenta - ? WHERE id = ? LIMIT 1");
      $stmt->bind_param('di', $cantidadVieja, $userId);
      $stmt->execute();
      $stmt->close();
    } else if ($tipoPagoViejo === 'efectivo') {
      $stmt = $mysqli->prepare("UPDATE usuarios SET efectivo = efectivo - ? WHERE id = ? LIMIT 1");
      $stmt->bind_param('di', $cantidadVieja, $userId);
      $stmt->execute();
      $stmt->close();
    } else {
      // Futuras cuentas: si el valor no coincide con 'cuenta'/'efectivo', de momento no toca totales (acorde a tu flexibilidad)
    }
  }

  // 3) Actualizar el movimiento con los datos nuevos
  // Construimos dinámicamente el SET para actualizar solo lo que llega
  $sets = [];
  $params = [];
  $types = '';

  if ($cantidadNueva !== null) { $sets[] = "cantidad = ?";      $params[] = $cantidadNueva; $types .= 'd'; }
  if ($conceptoId    !== null) { $sets[] = "concepto_id = ?";    $params[] = $conceptoId;    $types .= 'i'; }
  if ($observaciones !== null) { $sets[] = "observaciones = ?";  $params[] = $observaciones; $types .= 's'; }
  if ($tipoPagoNuevo !== null) { $sets[] = "tipo_pago = ?";      $params[] = $tipoPagoNuevo; $types .= 's'; }
  if ($fechaElegida  !== null) { $sets[] = "fecha_elegida = ?";  $params[] = $fechaElegida;  $types .= 's'; }
  if ($moneda        !== null) { $sets[] = "moneda = ?";         $params[] = $moneda;        $types .= 's'; }

  if (empty($sets)) {
    throw new Exception('Nada que actualizar');
  }

  $sql = "UPDATE movimientos SET " . implode(', ', $sets) . " WHERE id = ? AND user_id = ? LIMIT 1";
  $types .= 'ii';
  $params[] = $id;
  $params[] = $userId;

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
//   if ($stmt->affected_rows < 0) {
//     throw new Exception('Error al actualizar el movimiento');
//   }
  $stmt->close();

  // 4) Leer el movimiento ya actualizado para aplicar +nuevo
  $stmt = $mysqli->prepare("SELECT cantidad, tipo_pago FROM movimientos WHERE id = ? AND user_id = ? LIMIT 1");
  $stmt->bind_param('ii', $id, $userId);
  $stmt->execute();
  $nuevo = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  $cantidadNuevaAplicar = (float)$nuevo['cantidad'];
  $tipoPagoNuevoAplicar = $nuevo['tipo_pago'];

  if ($tipoPagoNuevoAplicar !== null && $tipoPagoNuevoAplicar !== '') {
    if ($tipoPagoNuevoAplicar === 'cuenta') {
      $stmt = $mysqli->prepare("UPDATE usuarios SET cuenta = cuenta + ? WHERE id = ? LIMIT 1");
      $stmt->bind_param('di', $cantidadNuevaAplicar, $userId);
      $stmt->execute();
      $stmt->close();
    } else if ($tipoPagoNuevoAplicar === 'efectivo') {
      $stmt = $mysqli->prepare("UPDATE usuarios SET efectivo = efectivo + ? WHERE id = ? LIMIT 1");
      $stmt->bind_param('di', $cantidadNuevaAplicar, $userId);
      $stmt->execute();
      $stmt->close();
    } else {
      // futuras cuentas: por ahora no tocamos totales
    }
  }

  $mysqli->commit();
  echo json_encode(['succes' => true, 'id' => $id]);

} catch (Exception $e) {
  $mysqli->rollback();
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
}
