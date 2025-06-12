<?php
// cookie_consent.php
require_once __DIR__ . '\db.php'; // Cambia la ruta si tu conexión está en otro sitio

function getUserIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

header('Content-Type: application/json');

// ---- 1. CREAR TABLA SI NO EXISTE ----
$conn->query("
    CREATE TABLE IF NOT EXISTS cookie_consent (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        user_agent TEXT NOT NULL,
        consent TINYINT(1) NOT NULL, -- 1 = aceptado, 0 = rechazado
        consent_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");

// ---- 2. INSERTAR CONSENTIMIENTO ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    $consent = isset($input['consent']) && $input['consent'] == 1 ? 1 : 0;
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    $ip = getUserIP();
    $timestamp = time();

    // Crea un hash seguro con los tres datos
    $hash = hash('sha256', $timestamp . $user_agent . $ip);

    // Guarda en la base de datos
    $stmt = $conn->prepare("INSERT INTO cookie_consent (ip, user_agent, consent, consent_hash, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssis", $ip, $user_agent, $consent, $hash);
    $stmt->execute();

    // Responde con el hash y la fecha
    echo json_encode([
        'status' => 'ok',
        'hash' => $hash,
        'expires' => date('c', strtotime('+1 year'))
    ]);
    exit;
}

echo json_encode(['status' => 'error', 'msg' => 'Invalid request']);
