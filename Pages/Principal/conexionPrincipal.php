<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
require_once '../../db.php';  // tu conexión compartida
date_default_timezone_set('Europe/Madrid'); // Ajusta según tu zona

// 1) Verificar que el usuario está autenticado
if (empty($_SESSION['user_id'])) {
    echo json_encode(['error' => 'No autenticado']);
    exit;
}
$userId = (int)$_SESSION['user_id'];

// 2) Crear las tablas necesarias si no existen (sin tocar la tabla usuarios)
$creations = [
    // Conceptos
    "CREATE TABLE IF NOT EXISTS conceptos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        es_ingreso BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;",
    // Etiquetas
    "CREATE TABLE IF NOT EXISTS etiquetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;",
    // Movimientos
    "CREATE TABLE IF NOT EXISTS movimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cantidad DECIMAL(15,2) NOT NULL,
        moneda VARCHAR(3) NOT NULL,
        concepto_id INT NOT NULL,
        observaciones TEXT,
        tipo_pago VARCHAR(10) NOT NULL,
        fecha_elegida DATE NULL,
        dia_recurrente VARCHAR(10) NULL,
        frecuencia VARCHAR(10) NULL,
        imagen VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id)     REFERENCES usuarios(id)    ON DELETE CASCADE,
        FOREIGN KEY(concepto_id) REFERENCES conceptos(id)
    ) ENGINE=InnoDB;",
    // Pivot movimiento_etiqueta
    "CREATE TABLE IF NOT EXISTS movimiento_etiqueta (
        movimiento_id INT NOT NULL,
        etiqueta_id   INT NOT NULL,
        PRIMARY KEY (movimiento_id, etiqueta_id),
        FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE,
        FOREIGN KEY (etiqueta_id)   REFERENCES etiquetas(id)   ON DELETE CASCADE
    ) ENGINE=InnoDB;"
];

foreach ($creations as $sql) {
    if (!$conn->query($sql)) {
        echo 'Error creando tablas: ' . $conn->error;
        exit;
    }
}

// 3) Leer y sanear POST
$cantidad      = floatval($_POST['cantidad'] ?? 0);
$moneda        = $conn->real_escape_string($_POST['moneda'] ?? '');
$concepto      = $conn->real_escape_string($_POST['concepto'] ?? '');
$observaciones = $conn->real_escape_string($_POST['observaciones'] ?? '');
$etiquetasCSV  = $_POST['etiquetas'] ?? '';
$tipoPago      = $conn->real_escape_string($_POST['tipoPago'] ?? '');




// ── Fecha elegida: convertir "d-m-Y" ➔ "Y-m-d" para MySQL DATE
$rawDate = $_POST['fechaElegida'] ?? '';
if ($rawDate !== '') {
    $dt = DateTime::createFromFormat('d-m-Y', $rawDate);
    if (!$dt) {
        // Fallback alternativo si el formato no coincide
        $dt = new DateTime($rawDate);
    }
    $fechaElegidaVar = $dt->format('Y-m-d');
} else {
    // Para "Ahora", usar fecha actual
    $fechaElegidaVar = date('Y-m-d');
}



$diaRecurrenteVar = !empty($_POST['diaRecurrente'])
    ? $conn->real_escape_string($_POST['diaRecurrente'])      
    : null;

$frecuenciaVar = !empty($_POST['frecuencia'])
    ? $conn->real_escape_string($_POST['frecuencia'])  // e.g. "Mensual"
    : null;        




// 4) Procesar imagen
$imagenPath = "NULL";
if (!empty($_FILES['imagenCompra']) && $_FILES['imagenCompra']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '../../Movimientos/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $tmpName  = $_FILES['imagenCompra']['tmp_name'];
    $baseName = time() . '_' . basename($_FILES['imagenCompra']['name']);
    $dest     = $uploadDir . $baseName;

    if (move_uploaded_file($tmpName, $dest)) {
        $imagenPath = $conn->real_escape_string('uploads/' . $baseName) ;
    }
}

// 5) Insertar todo en transacción
$conn->begin_transaction();
try {
    // 5.1) Concepto: buscar o crear
    $stmt = $conn->prepare("SELECT id FROM conceptos WHERE user_id=? AND nombre=? LIMIT 1");
    $stmt->bind_param('is', $userId, $concepto);
    $stmt->execute();
    $stmt->bind_result($conceptoId);
    if (!$stmt->fetch()) 
    {
        $ins = $conn->prepare("INSERT INTO conceptos(user_id,nombre) VALUES(?,?)");
        $ins->bind_param('is', $userId, $concepto);
        $ins->execute();
        $conceptoId = $ins->insert_id;
        $ins->close();
    }
    $stmt->close();

    // 5.2) Etiquetas: buscar/crear cada una
    $etiquetaIds = [];
    foreach (explode(',', $etiquetasCSV) as $et) {
        $et = trim($et);
        if ($et === '') continue;

        $stmt = $conn->prepare("SELECT id FROM etiquetas WHERE user_id=? AND nombre=? LIMIT 1");
        $stmt->bind_param('is', $userId, $et);
        $stmt->execute();
        $stmt->bind_result($etId);
        if (!$stmt->fetch()) 
        {
            $ins = $conn->prepare("INSERT INTO etiquetas(user_id,nombre) VALUES(?,?)");
            $ins->bind_param('is', $userId, $et);
            $ins->execute();
            $etId = $ins->insert_id;
            $ins->close();
        }
        $stmt->close();
        $etiquetaIds[] = $etId;
    }

    // 5.3) Insertar movimiento
    $sql = "
      INSERT INTO movimientos
        (user_id,cantidad,moneda,concepto_id,observaciones,
         tipo_pago,fecha_elegida,dia_recurrente,frecuencia,imagen)
      VALUES
        (?,?,?,?,?,?,?,?,?,?)
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
      'idsissssss',
      $userId,
      $cantidad,
      $moneda,
      $conceptoId,
      $observaciones,
      $tipoPago,
      $fechaElegidaVar,
      $diaRecurrenteVar,
      $frecuenciaVar,
      $imagenPath
    );

    $stmt->execute();
    $movId = $stmt->insert_id;
    $stmt->close();

    // Determinar en qué columna actualizar
    if ($tipoPago === 'efectivo') {
        $col = 'efectivo';
    } else {
        // si vino vacío o distinto, tratamos como cuenta
        $col = 'cuenta';
    }
    // Sumar la cantidad al saldo del usuario
    $upd = $conn->prepare("UPDATE usuarios SET $col = $col + ? WHERE id = ?");
    $upd->bind_param('di', $cantidad, $userId);
    $upd->execute();
    $upd->close();

    // 5.4) Relación muchos a muchos
    $stmt = $conn->prepare("INSERT INTO movimiento_etiqueta(movimiento_id, etiqueta_id) VALUES(?,?)");
    foreach ($etiquetaIds as $etId) {
        $stmt->bind_param('ii', $movId, $etId);
        $stmt->execute();
    }
    $stmt->close();

    $conn->commit();
    echo json_encode(['success' => true, 'movimiento_id' => $movId]);

} catch (Exception $e) {
    $conn->rollback();
    echo 'Error al guardar: ' . $e->getMessage();
}

$conn->close();
