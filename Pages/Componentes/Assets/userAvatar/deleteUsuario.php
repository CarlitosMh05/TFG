<?php
require_once '../../../../auth.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['success' => false]); exit; }
$userId = $_SESSION['user_id'];
require '../../../../db.php';

// Borra movimientos, etiquetas, conceptos, y usuario
$conn->prepare("DELETE FROM movimientos WHERE user_id = ?")->execute([$userId]);
$conn->prepare("DELETE FROM movimiento_etiqueta WHERE movimiento_id IN (SELECT id FROM movimientos WHERE user_id = ?)")->execute([$userId]);
$conn->prepare("DELETE FROM conceptos WHERE user_id = ?")->execute([$userId]);
$conn->prepare("DELETE FROM etiquetas WHERE user_id = ?")->execute([$userId]);
$conn->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$userId]);
session_destroy();
echo json_encode(['success' => true]);
