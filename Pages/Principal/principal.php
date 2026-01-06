<?php
require_once '../../auth.php';
require_once '../../db.php';

$uid = $_SESSION['user_id'];
// 1) Nombre de usuario
$userRow = $conn->query("SELECT nombre FROM usuarios WHERE id = $uid")->fetch_assoc();
$userName = $userRow['nombre'];

// Rango del mes actual
$monthStart = date('Y-m-01 00:00:00');
$monthEnd   = date('Y-m-t 23:59:59');

// 2) Crear las tablas necesarias si no existen (sin tocar la tabla usuarios)
$creations = [
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


// 2) Breakdown de gastos por concepto
$expStmt = $conn->prepare("
  SELECT c.nombre AS label, 
         SUM(ABS(m.cantidad)) AS total
    FROM movimientos m 
    JOIN conceptos c ON m.concepto_id = c.id
   WHERE m.user_id = ?
     AND m.cantidad < 0
     AND m.created_at BETWEEN ? AND ?
   GROUP BY c.nombre
");
$expStmt->bind_param('iss', $uid, $monthStart, $monthEnd);
$expStmt->execute();
$expRes = $expStmt->get_result();

$expenseLabels = [];
$expenseData   = [];
$totalExpense  = 0;
while ($r = $expRes->fetch_assoc()) {
  $expenseLabels[] = $r['label'];
  $expenseData[]   = floatval($r['total']);
  $totalExpense   += floatval($r['total']);
}

// 3) Breakdown de ingresos por concepto
$incStmt = $conn->prepare("
  SELECT c.nombre AS label, 
         SUM(m.cantidad) AS total
    FROM movimientos m 
    JOIN conceptos c ON m.concepto_id = c.id
   WHERE m.user_id = ?
     AND m.cantidad > 0
     AND m.created_at BETWEEN ? AND ?
   GROUP BY c.nombre
");
$incStmt->bind_param('iss', $uid, $monthStart, $monthEnd);
$incStmt->execute();
$incRes = $incStmt->get_result();

$incomeLabels  = [];
$incomeData    = [];
$totalIncome   = 0;
while ($r = $incRes->fetch_assoc()) {
  $incomeLabels[] = $r['label'];
  $incomeData[]   = floatval($r['total']);
  $totalIncome   += floatval($r['total']);
}


// Calculados ya los totales...
$net = $totalIncome - $totalExpense;

?>

<html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Document</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>


    <link rel="stylesheet" href="principal.css"> <!--CSS de la pagina--> 
    <link rel="stylesheet" href="../darkmode.css"> <!--CSS de la pagina--> 

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> <!--Jquery --> 
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"> <!--CSS de los calendarios--> 
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script> <!--JS de los calendarios--> 
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script> <!--JS de los calendarios en español--> 

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>

    <script src="https://unpkg.com/lucide@latest"></script>

    <link rel="stylesheet" href="../Componentes/Assets/sideMenu/sideMenu.css">
    <?php include $_SERVER['DOCUMENT_ROOT'].'/Pages/Componentes/sideMenu.php'; ?>
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
    <?php include $_SERVER['DOCUMENT_ROOT'].'/Pages/Componentes/user.php'; ?>


   
  </head>

  <body>
    <div class="principal-header">
      <div class="greeting">
        <p id="nombreSaludo">Hola, <?= htmlspecialchars($userName) ?></p>

        <div style="display: flex; justify-content: center; gap: 10px;" id="resumenContainer">
          <!-- Ponemos un id aquí para el resumen -->
          <p id="monthlySummary"> Resumen mensual: </p>
          <span id="monthlyNet"><?= number_format($net, 2, '.', ' ') ?></span> 
        </div>
      </div>

    <div class="main">

      <div id="stickyResumen" class="sticky-resumen" style="display: none;">
        <span id="stickyResumenLabel">Resumen mensual: </span>
        <span id="stickyResumenCantidad"></span>
      </div>
      <div class="month-selector">
       <span id="goToTodayText" class="volver-hoy">Hoy</span>
        <!-- FRECUENCIA -->
       <div class="input-container" id="selectFrecuencia" style="min-width: 150px; width: auto;">

          <div class="frecuencia-show-dropdown">
            <div class="frecuencia-show-display" id="frecuenciaShowDisplay">Mensual</div>
            <ul class="frecuencia-show-options" id="frecuenciaShowOptions">
              <li data-value="diaria">Diaria</li>
              <li data-value="semanal">Semanal</li>
              <li data-value="mensual">Mensual</li>
              <li data-value="trimestral">Trimestral</li>
              <li data-value="anual">Anual</li>
              <li data-value="rango">Rango personalizado</li>
            </ul>
          </div>

          <input type="hidden" id="selectedFrecuenciaShow" required>
          <label for="concepto" id="frecuenciaShow" style="background-color: #f7f7f7;">Frecuencia</label>
        </div>

        <div id="selectMonth">
          <!-- FLECHAS Y TEXTO -->
          <button class="month-arrow" id="prevMonth">‹</button>
          <div id="currentMonthText"></div>
          <button class="month-arrow" id="nextMonth">›</button>
        </div>
        <!-- CALENDARIO -->
        <button id="customDateBtn" title="Elegir fecha" class="calendar-icon-button">
          <i data-lucide="calendar-days"></i>
        </button>

       
        
        <div class="input-container" id="orderByEtiqueta">
          <div class="frecuencia-show-dropdown">
            <div class="frecuencia-show-display" id="etiquetaShowDisplay" style="text-align: center;">Sin etiqueta</div>
            <ul class="frecuencia-show-options" id="etiquetaShowOptions">
              <!-- Aquí se insertan las etiquetas por JS -->
            </ul>
          </div>
          <input type="hidden" id="selectedEtiquetaShow">
          <label for="selectedEtiquetaShow" id="etiquetaShow" style="background-color: #f7f7f7;">Ordenar por etiqueta</label>
        </div>

      </div>

      <!-- Flatpickr input oculto para rango -->
      <input type="text" id="rangoFechas" style="display:none;" />

      <div class="charts-wrapper">
        <div class="charts-container" id="circularCharts" >

          <div class="chart-box">
            <div class="chart-title">
                <span class="title">Gastos:</span>
                <span class="amount" id="expensesTotal">
                  -<?= number_format($totalExpense,2,'.',' ') ?> €
                </span>
            </div>
              <canvas id="expensesChart"></canvas>
          </div>

          <div class="chart-box">
            <div class="chart-title">
              <span class="title">Ingresos:</span>
              <span class="amount" id="incomeTotal">
                <?= number_format($totalIncome,2,'.',' ') ?> €
              </span>
            </div>
            <canvas id="incomeChart"></canvas>
          </div>
          

        </div>
          <div id="stickyLimit" style="height: 1px; widht: 100%;" ></div>



        <div class="charts-container" id="trendChartsContainer">
          <div class="chart-box" id="trendChartContainer" style="display: none;">
            <div class="chart-title" id="trendChartTitle">
              <h1 class="title" style="font-size: 1.5rem"></h1>
            </div>

            <canvas id="trendChart"></canvas>
          </div>

          <div class="switch-container">
            <span>Resumen Neto</span>
            <label class="switch">
                <input type="checkbox" id="trendChartSwitch">
                <span class="slider round"></span>
            </label>
            <span>Ingreso/Gasto</span>
          </div>
        </div>

        

      </div>

      

      <div id="noMovimientos" class="no-movimientos" style="display: none;">
        <p>Todavía no tienes ningun movimiento</p>
        <p>Añade uno ahora</p>

        <div class="flecha-container">
            <span class="flecha">☟</span>
        </div>

      </div>
    </div>


  
    <script>
        const CHART_DATA = {
          expense: {
            labels: <?= json_encode($expenseLabels, JSON_UNESCAPED_UNICODE) ?>,
            data:   <?= json_encode($expenseData,   JSON_NUMERIC_CHECK) ?>
          },
          income: {
            labels: <?= json_encode($incomeLabels, JSON_UNESCAPED_UNICODE) ?>,
            data:   <?= json_encode($incomeData,   JSON_NUMERIC_CHECK) ?>
          }
        };
    </script>

    <script src="principal.js"></script>    
    <script src="../Componentes/Assets/userAvatar/user.js"></script>
    
  </body>
</html>
