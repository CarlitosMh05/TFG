<?php
require_once '../../auth.php';
require_once '../../db.php';

$uid = $_SESSION['user_id'];
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Movimientos</title>
  <link rel="stylesheet" href="movimientos.css"> <!-- si tienes estilos extra -->
    <link rel="stylesheet" href="../darkmode.css"> <!--CSS de la pagina--> 

  <link rel="icon" href="../../favicon.ico">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>


  <link rel="stylesheet" href="../Componentes/Assets/sideMenu/sideMenu.css">
  <?php include $_SERVER['DOCUMENT_ROOT'].'/Pages/componentes/sideMenu.php'; ?>
  <script src="../Componentes/Assets/sideMenu/sideMenu.js"></script>

  <?php
  $userEfectivo = isset($user['efectivo']) ? $user['efectivo'] : null;
  ?>
  <?php include $_SERVER['DOCUMENT_ROOT'].'/Pages/Componentes/modal_movimientos.php'; ?>
  <link rel="stylesheet" href="../Componentes/Assets/addMovimientos/movimientos.css">
  <script>
    var userEfectivo = <?php echo json_encode($userEfectivo); ?>;
  </script>
  <script src="../Componentes/Assets/addMovimientos/movimientos.js"></script>

  <link rel="stylesheet" href="../Componentes/Assets/userAvatar/user.css">
  <?php include $_SERVER['DOCUMENT_ROOT'].'/Pages/componentes/user.php'; ?>
  <script src="../Componentes/Assets/userAvatar/user.js"></script>

</head>
<body>
 

  <!-- Contenedor principal con margen -->
  <main class="main">
    <!-- Título -->
    <div class="titulo-movimientos">

      <div class="admin-datos-bar">
        <div class="admin-datos-accion" id="descargarBtn">
          <i data-lucide="download" class="admin-datos-icon"></i>
          <span>Descargar</span>
        </div>
        <div class="admin-datos-accion" id="importarBtn">
          <i data-lucide="upload" class="admin-datos-icon"></i>
          <span>Importar</span>
        </div>
      </div>

      <h1 class="titulo-principal">Movimientos</h1>
      
      <button id="toggleFiltrosBtn" class="filtro-btn">
        <i data-lucide="filter"></i> Filtros
      </button>
    </div>

    <!-- Filtros desplegables -->
    <div id="filtrosBlock" class="filtros-block">
      <div class="filtros-flex">
        <!-- Concepto -->
        <div class="input-container" id="filtroConceptoContainer">

          <div class="concepto-dropdown" >
            <div class="concepto-display" id="filtroConceptoDisplay">Seleccionar concepto</div>
            <ul class="concepto-options" id="filtroConceptoOptions">
            </ul>
          </div>

          <input type="hidden" id="filtroConceptoValue" required>
          <label for="filtroConcepto" id="concepto">Concepto</label>
        </div>

        <!-- Etiqueta -->
        <div class="input-container etiqueta-container" id="filtroEtiquetaContainer">
          <div class="etiqueta-dropdown">
            <div class="etiqueta-display" id="filtroEtiquetaDisplay">Seleccionar etiquetas</div>
            
            <ul class="etiqueta-options" id="filtroEtiquetaOptions">
              <li class="add-new" data-type="etiqueta">+ Añadir etiqueta</li>  
            </ul>
          </div>
          
          <input type="hidden" id="filtroEtiqueta" required>
          <label for="filtroEtiqueta" id="labelEtiqueta">Etiquetas</label>
          
        </div>
        <!-- Fechas -->
        <div class="input-container floating-label-group" style="min-width:170px; position:relative; width: fit-content;">
          <input type="text" id="filtroFecha" class="filtro-input floating-label-input" autocomplete="off">
          <label for="filtroFecha" class="floating-label">Rango</label>
        </div>
        <!-- Botón limpiar -->
        <div>
          <button id="limpiarFiltrosBtn" class="limpiar-filtros-btn">
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Contenedor movimientos (aquí se cargan los días/movimientos) -->
    <div id="movimientosList" class="movimientos-list"></div>

    <!-- Mensaje sin movimientos -->
    <div id="noMovimientosMsg" class="no-movimientos">
      <p>No hay movimientos en este periodo.</p>
      <div class="flecha-container">⬇</div>
    </div>
  </main>


  


 

  <!-- Modal de imagen de movimiento -->
  <div id="modalImagenMovimiento" class="modal-imagen-mov-overlay" style="display:none;">
    <div class="modal-imagen-mov">
      <img id="modalImagenMovImg" src="" alt="Imagen movimiento en grande" />
      <div class="modal-imagen-mov-actions">
        <a id="modalImagenMovDescargar" href="#" download target="_blank" class="descargar-btn">Descargar</a>
        <button id="modalImagenMovCerrar" class="cerrar-btn">Cerrar</button>
      </div>
    </div>
  </div>

  <!-- Modal DESCARGAR DATOS -->
  <div class="modal-admin-datos-overlay" id="modalDescargarOverlay"></div>
  <div class="modal-admin-datos" id="modalDescargar">
    <div class="modal-admin-datos-header">
      <i data-lucide="download"></i>
      <span>Descargar movimientos</span>
    </div>
    <div class="modal-admin-datos-content">
      <form id="formDescargarDatos">
        <label class="form-label">Selecciona el formato:</label>
        <div class="radio-group">
          <label>
            <input type="radio" name="formato" value="csv" checked>
            CSV
          </label>
          <label>
            <input type="radio" name="formato" value="excel">
            Excel (.xlsx)
          </label>
          <label>
            <input type="radio" name="formato" value="pdf">
            PDF
          </label>
        </div>
        <div style="text-align: right; margin-top: 28px;">
          <button type="button" class="admin-datos-cancel-btn" id="cancelDescargarBtn">Cancelar</button>
          <button type="submit" class="admin-datos-confirm-btn">Descargar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal IMPORTAR DATOS -->
  <div class="modal-admin-datos-overlay" id="modalImportarOverlay"></div>
  <div class="modal-admin-datos" id="modalImportar">
    <div class="modal-admin-datos-header">
      <i data-lucide="upload"></i>
      <span>Importar movimientos</span>
    </div>
    <div class="modal-admin-datos-content">
      <form id="formImportarDatos">
        <label class="form-label">Selecciona un archivo o arrástralo aquí:</label>
        <div class="dropzone" id="dropzoneImportar">
          <span id="importarFileText">Haz clic o arrastra un archivo CSV o Excel (.xlsx)</span>
        </div>
        <input type="file" id="inputImportarArchivo" name="archivo" accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none;">

        <div id="nombreArchivoImportar" style="margin-top: 8px; color:#222; font-size:0.98rem;"></div>
        <div style="text-align: right; margin-top: 28px;">
          <button type="button" class="admin-datos-cancel-btn" id="cancelImportarBtn">Cancelar</button>
          <button type="submit" class="admin-datos-confirm-btn" id="btnImportarArchivo" style="position: relative;">
            <span class="importar-texto">Importar</span>
            <div class="spinner spinner-importar"></div>
          </button>
        </div>
      </form>
    </div>
  </div>



  <!-- Modal de añadir movimiento (usa el mismo HTML/modal que tienes en principal) -->
  <!-- ...aquí iría tu modal de añadir movimiento, copia exacta... -->
  
  <script src="movimientos.js"></script> <!-- El nuevo JS para scroll infinito y gestión de la lista -->
</body>
</html>
