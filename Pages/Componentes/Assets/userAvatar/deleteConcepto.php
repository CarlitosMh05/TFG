<?php
require_once '../../../../auth.php';
require '../../../../db.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['success' => false]); exit; }
$userId = $_SESSION['user_id'];
$id = intval($_POST['id']);

if (isset($_POST['editar_movimientos']) && $_POST['editar_movimientos'] == 1) {
    $conceptoId      = intval($_POST['id']);
    $nuevoConceptoId = intval($_POST['nuevo_concepto_id']);
    // 1. Cambia todos los movimientos a nuevo concepto
    $sql1 = "UPDATE movimientos SET concepto_id=? WHERE concepto_id=?";
    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param('ii', $nuevoConceptoId, $conceptoId);
    if (!$stmt1->execute()) {
        echo json_encode(['success' => false, 'error' => 'Error al actualizar movimientos.']);
        exit;
    }
    // 2. Elimina el concepto original
    $sql2 = "DELETE FROM conceptos WHERE id=?";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param('i', $conceptoId);
    if (!$stmt2->execute()) {
        echo json_encode(['success' => false, 'error' => 'Error al eliminar concepto.']);
        exit;
    }
    echo json_encode(['success' => true]);
    exit;
}


// Comprobar si hay movimientos asociados a este concepto
$stmt = $conn->prepare("SELECT COUNT(*) as total FROM movimientos WHERE concepto_id = ? AND user_id = ?");
$stmt->bind_param("ii", $id, $userId);
$stmt->execute();
$stmt->bind_result($total);
$stmt->fetch();
$stmt->close();

if ($total > 0 && empty($_POST['force'])) {
    echo json_encode(['success' => false, 'movimientos' => $total]);
    exit;
}

if (!empty($_POST['force'])) {
    // Si forzamos, primero borramos los movimientos
    $stmt = $conn->prepare("DELETE FROM movimientos WHERE concepto_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $id, $userId);
    $stmt->execute();
    $stmt->close();
}

// Ahora sí borramos el concepto
$stmt = $conn->prepare("DELETE FROM conceptos WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $id, $userId);
$stmt->execute();
$stmt->close();

echo json_encode(['success' => true]);
