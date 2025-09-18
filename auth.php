<?php
ini_set('session.gc_maxlifetime', 0); 
ini_set('session.cookie_lifetime', 0); 
session_start();

// Si no hay user_id en sesión, redirige al login
if (empty($_SESSION['user_id'])) {
    header('Location: /Pages/InicioSesion/inicioSesion.html');
    exit;
}

?>