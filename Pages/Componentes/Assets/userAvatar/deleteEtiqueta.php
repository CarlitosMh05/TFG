<?php
require_once '../../../../auth.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['success' => false]); exit; }
$userId = $_SESSION['user_id'];
$id = intval($_POST['id']);
require '../../../../db.php';

$stmt = $conn->prepare("DELETE FROM etiquetas WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $userId]);
echo json_encode(['success' => true]);
