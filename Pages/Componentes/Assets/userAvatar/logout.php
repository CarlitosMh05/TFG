<?php
session_start();
session_destroy();
header("Location: ../../../../Pages/InicioSesion/inicioSesion.html"); // Cambia a la ruta de tu login
exit;
?>
