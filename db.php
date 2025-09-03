<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
//Peuqño cambio
$servername = "localhost:3306";  // Servidor MySQL
$username = "root";         // Usuario de MySQL
$password = "";             // Contraseña de MySQL
$dbname = "tfg";           // Nombre de la base de datos

//$servername = "127.0.0.1:3306";  // Servidor MySQL
//$username = "u982231885_root";         // Usuario de MySQL
//$password = "2#W~3]b~Z";             // Contraseña de MySQL
//$dbname = "u982231885_TFG";      // Nombre de la base de datos


// Conectar al servidor MySQL (sin seleccionar base de datos)
$conn = new mysqli($servername, $username, $password);

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode(['error' => 'Error al conectar con la base de datos:.'. $conn->connect_error]);
}

// Verificar si la base de datos existe
$db_exists = $conn->query("SHOW DATABASES LIKE '$dbname'");

if ($db_exists->num_rows == 0) {
    // Si no existe, crearla
    $sql = "CREATE DATABASE $dbname";
    if (!($conn->query($sql) === TRUE)) 
    {
        echo json_encode(['error' => 'Error al crear la base de datos:.'. $conn->error]);
    } 
} 

// Cerrar conexión inicial
$conn->close();

// Coonectarse a la base de datos existente o recién creada
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión a la base de datos
if ($conn->connect_error) {
        echo json_encode(['error' => 'Error con la conexión de la base de datos:'. $conn->connect_error]);
} 


?>
