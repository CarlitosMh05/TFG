<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

try {
    require_once '../../../../auth.php';
    require_once '../../../../db.php';  // aquí $db es mysqli

    $uid    = $_SESSION['user_id'];
    $nombre = trim($_POST['nombre'] ?? '');

    if ($nombre === '') {
        echo json_encode([
            'success' => false,
            'error'   => "El nombre no puede estar vacio"
        ]);
        exit;
    }

    // 1) Comprobar duplicados
    $stmt = $conn->prepare("SELECT COUNT(*) FROM etiquetas WHERE user_id = ? AND nombre = ?");
    $stmt->bind_param('is', $uid, $nombre);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();

    if ($count > 0) {
        echo json_encode([
            'success' => false,
            'alredyExists'   => "La etiqueta «{$nombre}» ya existe"
        ]);
        exit;
    }

    // 2) Insertar
    $stmt = $conn->prepare("INSERT INTO etiquetas (user_id, nombre) VALUES (?, ?)");
    $stmt->bind_param('is', $uid, $nombre);
    $stmt->execute();
    $newId = $conn->insert_id;
    $stmt->close();

    echo json_encode([
        'success' => true,
        'id'      => $newId,
        'nombre'  => $nombre
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
