<?php
include '../../auth.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comparar fechas | Finanzas</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="comparar.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script>

  <script src="https://unpkg.com/lucide@latest"></script>

  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>


  <link rel="stylesheet" href="../Componentes/Assets/sideMenu/sideMenu.css">
    <link rel="stylesheet" href="../darkmode.css"> <!--CSS de la pagina--> 

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
  <main class="comparar-main">
    <div class="comparar-columnas-contenedor">
      
      <div class="comparar-columnas">
      

        <div class="columna-comparar" id="columnaIzq" style="margin-left: 75px;">
          <div class="columna-cabecera" id="cabeceraIzq">
            <!-- Fila 1: Ir a actual | Selector frecuencia | Calendario -->
            <div class="cabecera-row cabecera-row-1">
              <div class="cabecera-izq">
                <span class="go-to-actual volver-hoy" id="goToActualIzq">Ir a mes actual</span>
              </div>

              <div class="cabecera-row cabecera-row-4">
              <div class="input-container orderByEtiqueta">
                <div class="etiqueta-show-dropdown">
                  <div class="etiqueta-show-label-wrap">
                    <span class="etiqueta-show-label" id="etiquetaShowIzq">Etiqueta</span>
                  </div>
                  <div class="etiqueta-show-display" id="etiquetaShowDisplayIzq">Todas</div>
                  <ul class="etiqueta-show-options" id="etiquetaShowOptionsIzq"></ul>
                </div>
              </div>
            </div>
              
              
            </div>
            <!-- Fila 2: Flechas y texto periodo -->
            <div class="cabecera-row cabecera-row-2">
              <div class="cabecera-centro">
                <div class="input-container">
                  <div class="frecuencia-show-dropdown">
                    <div class="frecuencia-show-display" id="frecuenciaShowDisplayIzq">Mensual</div>
                    <ul class="frecuencia-show-options" id="frecuenciaShowOptionsIzq">
                      <li data-value="diaria">Diaria</li>
                      <li data-value="semanal">Semanal</li>
                      <li data-value="mensual" class="active">Mensual</li>
                      <li data-value="trimestral">Trimestral</li>
                      <li data-value="anual">Anual</li>
                      <li data-value="rango">Rango personalizado</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="selecthMonth">
                <button id="prevPeriodoIzq" class="month-arrow" title="Anterior"><i data-lucide="chevron-left"></i></button>
                <div id="textoPeriodoIzq" class="texto-periodo-comparar"></div>
                <button id="nextPeriodoIzq" class="month-arrow" title="Siguiente"><i data-lucide="chevron-right"></i></button>
              </div>

              <div class="cabecera-der">
                <div class="calendar-container" style="position: relative; display: inline-block;">
                  <button id="customDateBtnIzq" class="calendar-btn" type="button">
                    <i data-lucide="calendar"></i>
                  </button>
                  <input id="rangoFechasIzq" type="text" autocomplete="off"/>
                </div>
              </div>
            </div>
            <!-- Fila 4: Selector de etiquetas -->

             
          </div>
            <!-- Fila 3: Resumen neto -->
            <div class="cabecera-row cabecera-row-3">
              <div class="resumen-box resumen-unificada" id="resumenUnificadaIzq">
                <span class="resumen-label" id="labelResumenIzq">Resumen mensual</span>
                <span class="resumen-cantidad" id="cantidadResumenIzq">-- €</span>
              </div>
            </div>
           

          <!-- Gráficos IZQUIERDA -->
          <div class="graficos-horizontales">
            <div class="grafico-block">
              <div class="comparar-chart-title" id="tituloIngresosColIzq">Ingresos:<br><span>-- €</span></div>
              <canvas id="graficoIngresoIzq"></canvas>
              <div id="legendIngresoIzq" class="chartjs-legend"></div>
            </div>
            <div class="grafico-block">
              <div class="comparar-chart-title" id="tituloGastosColIzq">Gastos:<br><span>-- €</span></div>
              <canvas id="graficoGastoIzq"></canvas>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 12px;">

        
          <!-- Badge central de diferencia -->
            <div class="comparar-diferencia-central" id="badgeDiferencia"></div>
            <div class="swap-columns-bar2" style="display: none;">
              <button id="swapColumnsBtn2" title="Intercambiar columnas">
                <i data-lucide="arrow-left-right"></i>
              </button>
            </div>

        </div>

        <!-- Columna DERECHA -->
        <div class="columna-comparar" id="columnaDer"  style="margin-right: 75px;">
          <!-- Cabecera FILTROS DERECHA -->
          <div class="columna-cabecera" id="cabeceraDer">
            <!-- Fila 1: Ir a actual | Selector frecuencia | Calendario -->
            <div class="cabecera-row cabecera-row-1">
              <div class="cabecera-izq">
                <span class="go-to-actual volver-hoy" id="goToActualDer">Ir a mes actual</span>
              </div>

              <div class="cabecera-row cabecera-row-4">
              <div class="input-container orderByEtiqueta">
                <div class="etiqueta-show-dropdown">
                  <div class="etiqueta-show-label-wrap">
                    <span class="etiqueta-show-label" id="etiquetaShowDer">Etiqueta</span>
                  </div>
                  <div class="etiqueta-show-display" id="etiquetaShowDisplayDer">Todas</div>
                  <ul class="etiqueta-show-options" id="etiquetaShowOptionsDer"></ul>
                </div>
              </div>
            </div>
              
              
            </div>
            <!-- Fila 2: Flechas y texto periodo -->
            <div class="cabecera-row cabecera-row-2">

              <div class="cabecera-centro">
                <div class="input-container">
                  <div class="frecuencia-show-dropdown">
                    <div class="frecuencia-show-display" id="frecuenciaShowDisplayDer">Mensual</div>
                    <ul class="frecuencia-show-options" id="frecuenciaShowOptionsDer">
                      <li data-value="diaria">Diaria</li>
                      <li data-value="semanal">Semanal</li>
                      <li data-value="mensual" class="active">Mensual</li>
                      <li data-value="trimestral">Trimestral</li>
                      <li data-value="anual">Anual</li>
                      <li data-value="rango">Rango personalizado</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="selecthMonth">
                <button id="prevPeriodoDer" class="month-arrow" title="Anterior"><i data-lucide="chevron-left"></i></button>
                <div id="textoPeriodoDer" class="texto-periodo-comparar"></div>
                <button id="nextPeriodoDer" class="month-arrow" title="Siguiente"><i data-lucide="chevron-right"></i></button>
              </div>

              <div class="cabecera-der" id="calendarDer">
                <div class="calendar-container" style="position: relative; display: inline-block;">
                  <button id="customDateBtnDer" class="calendar-btn" type="button">
                    <i data-lucide="calendar"></i>
                  </button>
                  <input id="rangoFechasDer" type="text" autocomplete="off"/>
                </div>
                
              </div>
            </div>
            <!-- Fila 4: Selector de etiquetas -->
            
            <!-- Fila 3: Resumen neto -->
            <div class="cabecera-row cabecera-row-3">
             <div class="resumen-box resumen-unificada" id="resumenUnificadaIzq">
                <span class="resumen-label" id="labelResumenIzq">Resumen mensual</span>
                <span class="resumen-cantidad" id="cantidadResumenDer">-- €</span>
              </div>
            </div>
            
          </div>
          <!-- Gráficos DERECHA -->
          

          <div class="graficos-horizontales">
            <div class="grafico-block">
              <div class="comparar-chart-title" id="tituloIngresosColDer">Ingresos:<br><span>-- €</span></div>
              <canvas id="graficoIngresoDer"></canvas>
            </div>
            <div class="grafico-block">
              <div class="comparar-chart-title" id="tituloGastosColDer">Gastos:<br><span>-- €</span></div>
              <canvas id="graficoGastoDer"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <div class="swap-columns-bar">
    <button id="swapColumnsBtn" title="Intercambiar columnas">
      <i data-lucide="arrow-left-right"></i>
    </button>
  </div>
  <script src="comparar.js"></script>
</body>
</html>
