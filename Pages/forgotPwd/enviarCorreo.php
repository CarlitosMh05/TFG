<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once '../../db.php'; // Incluye la conexión asegurada



// Verificar si la tabla 'usuarios' existe
$table_exists = $conn->query("SHOW TABLES LIKE 'usuarios'");

if ($table_exists->num_rows == 0) {
    // Crear la tabla si no existe
    $sql = "CREATE TABLE usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        telefono VARCHAR(15)
    )";

    if (!($conn->query($sql) === TRUE))
    {
        echo json_encode(['error' => 'Error al crear la base de datos']);
        exit;
    } 
} 

$contraseñaAleatoria = "";

$email = $_POST['email'];
 
// Consultar los puntos y los datos del usuario
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE correo = '$email'");
$stmt->execute();
$result = $stmt->get_result();
$data = $result->fetch_assoc();

if ($_POST["form"] == "form1") 
{
    $phone = $_POST['phone']; 

    if (!($result->num_rows > 0))
    {
        echo json_encode(['noEmail' => 'Este email no esta en nuestra base de datos. Quieres <a href="../CrearCuenta/crearCuenta.html"> crear una cuenta</a>']);    
        exit;
    } 
    else
    {

        if($phone == $data['telefono'])
        {

            function generarContraseñaAleatoria($longitud = 12) 
            {
                $caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_';
                return substr(str_shuffle(str_repeat($caracteres, ceil($longitud / strlen($caracteres)))), 0, $longitud);
            }
        
            $contraseñaAleatoria = generarContraseñaAleatoria();
            
        
            $hashedPassword = password_hash($contraseñaAleatoria, PASSWORD_BCRYPT);
            
            $update = $conn->prepare("UPDATE usuarios SET contrasena = ? WHERE correo = ?");
            if (!($update->execute([$hashedPassword, $email])) )
            {
                echo json_encode(['error' => 'No se pudo actualizar la contraseña']);
                exit;
            } 
        }
        else
        {
            echo json_encode(['badNumber' => 'El número no coincide con el correo']);
            exit;
        }
    
    }
    
    
    require '../../PHPMailer-master/src/PHPMailer.php';
    require '../../PHPMailer-master/src/SMTP.php';
    require '../../PHPMailer-master/src/Exception.php';
    
    /*Parte de enviar el email*/
    $mail = new PHPMailer(true);
    
    try {
        //Configuración del servidor
        $mail->SMTPDebug = 0; //Habilita salida depuración detallada
        $mail->isSMTP(); //Usa SMTP para enviar
        $mail->Host = 'smtp.gmail.com'; //Especifica el servidor SMTP principal y de respaldo
        $mail->SMTPAuth = true; //Habilita autenticación SMTP
        $mail->Username = 'carlitosmh1272@gmail.com'; //Tu usuario SMTP
        $mail->Password = 'gyyy bnps ycrd csbo'; //Tu contraseña SMTP
        $mail->SMTPSecure = 'tls'; //Habilita encriptación TLS, `ssl` también es aceptado
        $mail->Port = 587; //Puerto TCP al cual conectarse
    
        //Destinatarios
        $mail->setFrom('carlitosmh1272@gmail.com', 'Tu Nombre'); //Dirección del remitente
        $mail->addAddress($email, 'Nombre del destinatario'); //Agrega un destinatario
    
        //Contenido
        $mail->isHTML(true); //Establece el formato del correo electrónico como HTML
        $mail->Subject = 'Nueva contraseña' . $contraseñaAleatoria;
        $mail->Body = 'Tu contraseña temporal es: '. $contraseñaAleatoria;
    
        $mail->send();
        echo json_encode(['send' => 'Correo enviado']);
        exit;
    } 
    catch (Exception $e) 
    {
        echo json_encode(['error' => 'No se pudo enviar el email']);
        exit;
    }
} 

elseif ($_POST["form"] == "form2") 
{
    $email = $_POST['email'];
    $temporalPwd = $_POST['temporalPwd'];
    $newPwd = $_POST['newPwd'];  
    $confirmationPwd = $_POST['confirmationPwd'];  
    if(password_verify($temporalPwd, $data['contrasena']))
    {
        if($newPwd == $confirmationPwd)
        {
            $hashedPassword2 = password_hash($newPwd, PASSWORD_BCRYPT);


            $update = $conn->prepare("UPDATE usuarios SET contrasena = ? WHERE correo = ?");

            if (!($update->execute([$hashedPassword2, $email])) )
            {
                echo json_encode(['error' => 'No se pudo actualizar la contraseña']);
                exit;
            } 
            else
            {
                echo json_encode(['pwdActualizada' => 'La contraseña ha sido actualizada conrrectamente']);
                exit;
            }
        }
        else
        {
            echo json_encode(['noCoinciden' => 'La confirmación no coincide con la contraseña original']);
            exit;
        }
    }
    else
    {
        echo json_encode(['badTemporalPwd' => 'La contraseña temporal no coincide']);
        exit;

    }
}






?>