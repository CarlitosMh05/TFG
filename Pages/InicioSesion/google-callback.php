<?php
require_once '../../db.php'; // Ajusta esta ruta según dónde tengas tu archivo de conexión

$token = $_POST['credential'] ?? null;
$response = ['success' => false];

if ($token) {
    // Validar el token con Google
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $token;
    $google_response = file_get_contents($url);
    $payload = json_decode($google_response, true);

    if ($payload && isset($payload['email'])) {
        $email = $payload['email'];
        $nombre = $payload['name'] ?? 'Usuario Google';

        // Verificar si el usuario ya existe
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $usuario = $result->fetch_assoc();

        if (!$usuario) {
            // Crear usuario si no existe
            $stmt = $conn->prepare("INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, '')");
            $stmt->bind_param("ss", $nombre, $email);
            $stmt->execute();
            $userId = $stmt->insert_id;
        } else {
            $userId = $usuario['id'];
        }

        // Iniciar sesión
        session_start();
        $_SESSION['user_id'] = $userId;
        $response['success'] = true;
    }
}

echo json_encode($response);
