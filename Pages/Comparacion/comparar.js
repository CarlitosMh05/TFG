// comparar.js: lógica modular para dos columnas independientes

// --------- Helpers y formato ----------
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function formatNumber(num, decimals = 2) {
  if (isNaN(num)) return '--';
  const fixed = Number(num).toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

// --------- Estado de cada columna ---------
const columnas = {
  izq: {
    frecuencia: 'mensual',
    periodoActual: new Date(),
    start: null,
    end: null,
    etiquetaId: null,
    ingresos: 0,
    gastos: 0,
    chartIngreso: null,
    chartGasto: null
  },
  der: {
    frecuencia: 'mensual',
    periodoActual: new Date(),
    start: null,
    end: null,
    etiquetaId: null,
    ingresos: 0,
    gastos: 0,
    chartIngreso: null,
    chartGasto: null
  }
};
const frecuencias = {
  diaria:     'diaria',
  semanal:    'semanal',
  mensual:    'mensual',
  trimestral: 'trimestral',
  anual:      'anual',
  rango:      'rango personalizado'
};
const optsLong = { day: 'numeric', month: 'long' };
const optsMonth = { month: 'long', year: 'numeric' };

// --------- Inicialización global ---------
$(function () {
  if (window.lucide) lucide.createIcons();
  // Inicializa ambas columnas
  initCol('izq');
  initCol('der');

  // Intercambiar columnas visualmente

});

// --------- Inicializador de columna ---------
function initCol(col) {
  // Dropdown frecuencia
  $(`#frecuenciaShowDisplay${capitalize(col)}`).on('click', function () {
    $(`#frecuenciaShowOptions${capitalize(col)}`).fadeToggle(120);
    $(this).toggleClass('open');
  });
  $(`#frecuenciaShowOptions${capitalize(col)} li`).on('click', function () {
    const val = $(this).data('value');
    columnas[col].frecuencia = val;
    $(`#frecuenciaShowDisplay${capitalize(col)}`).text(capitalize(frecuencias[val]));
    $(`#frecuenciaShowOptions${capitalize(col)} li`).removeClass('active');
    $(this).addClass('active');
    $(`#frecuenciaShowOptions${capitalize(col)}`).fadeOut(120);
    $(`#frecuenciaShowDisplay${capitalize(col)}`).removeClass('open');
    if (val === 'rango') {
      setTimeout(() => {
        document.getElementById(`rangoFechas${capitalize(col)}`)._flatpickr.open();
      }, 100);
    } else {
      columnas[col].start = null;
      columnas[col].end = null;
    }
    updateCabeceraCol(col);
    actualizarCol(col);
  });
  $(document).on('click', function (e) {
    if (!$(e.target).closest(`#frecuenciaShowDisplay${capitalize(col)}, #frecuenciaShowOptions${capitalize(col)}`).length) {
      $(`#frecuenciaShowOptions${capitalize(col)}`).fadeOut(120);
      $(`#frecuenciaShowDisplay${capitalize(col)}`).removeClass('open');
    }
  });

  // Handler global para cerrar los 2 calendarios de rango al hacer click fuera
  $(document).on('mousedown', function(e) {
    ['Izq', 'Der'].forEach(function(sufijo) {
      const fpInput = document.getElementById(`rangoFechas${sufijo}`);
      if (!fpInput) return;
      const flatpickrInstance = fpInput._flatpickr;
      if (!flatpickrInstance || !flatpickrInstance.isOpen) return;

      const calendarContainer = flatpickrInstance.calendarContainer;
      // Si el click NO es ni en el input (oculto), ni en el contenedor, ni en el botón calendario
      if (
        !calendarContainer.contains(e.target) &&
        e.target !== fpInput &&
        e.target !== document.getElementById(`customDateBtn${sufijo}`)
      ) {
        flatpickrInstance.close();
      }
    });
  });

  // Flatpickr rango de fechas
  flatpickr(`#rangoFechas${capitalize(col)}`, {
    mode: "range",
    dateFormat: "Y-m-d",
    locale: "es",
    onClose: function (dates) {
      if (dates.length === 2) {
        columnas[col].start = dates[0];
        columnas[col].end = dates[1];
        columnas[col].frecuencia = 'rango';
        $(`#frecuenciaShowDisplay${capitalize(col)}`).text(capitalize(frecuencias['rango']));
        $(`#frecuenciaShowOptions${capitalize(col)} li`).removeClass('active');
        $(`#frecuenciaShowOptions${capitalize(col)} li[data-value="rango"]`).addClass('active');
        updateCabeceraCol(col);
        actualizarCol(col);
      }
    }
  });

  // Botón calendario
  $(`#customDateBtn${capitalize(col)}`).on('click', function () {
    document.getElementById(`rangoFechas${capitalize(col)}`)._flatpickr.open();
  });

  // Flechas
  $(`#prevPeriodo${capitalize(col)}`).on('click', function () { avanzarPeriodoCol(col, -1); });
  $(`#nextPeriodo${capitalize(col)}`).on('click', function () { avanzarPeriodoCol(col, 1); });

  // "Ir a actual"
  $(`#goToActual${capitalize(col)}`).on('click', function () { resetPeriodoCol(col); });

  // Dropdown etiquetas
  function cargarDropdownEtiquetasCol() {
    $.getJSON('../../Pages/Componentes/Assets/fetchOptions.php', function (data) {
      let etiquetas = [{ id: '', nombre: 'Todas' }].concat(data.etiquetas || []);
      let $options = $(`#etiquetaShowOptions${capitalize(col)}`);
      $options.empty();
      etiquetas.forEach(e => {
        $options.append(`<li data-id="${e.id}">${e.nombre}</li>`);
      });
      // Actualiza el display
      const actual = etiquetas.find(etq => String(etq.id) === String(columnas[col].etiquetaId)) || etiquetas[0];
      $(`#etiquetaShowDisplay${capitalize(col)}`).text(actual.nombre);
    });
  }
  $(`#etiquetaShowDisplay${capitalize(col)}`).on('click', function () {
    cargarDropdownEtiquetasCol();
    $(`#etiquetaShowOptions${capitalize(col)}`).fadeToggle(120);
    $(this).toggleClass('open');
  });
  $(`#etiquetaShowOptions${capitalize(col)}`).on('click', 'li', function () {
    const id = $(this).data('id');
    columnas[col].etiquetaId = id === '' ? null : id;
    $(`#etiquetaShowDisplay${capitalize(col)}`).text($(this).text()).removeClass('open');
    $(`#etiquetaShowOptions${capitalize(col)}`).fadeOut(120);
    actualizarCol(col);
  });
  $(document).on('click', function (e) {
    if (!$(e.target).closest(`#etiquetaShowDisplay${capitalize(col)}, #etiquetaShowOptions${capitalize(col)}`).length) {
      $(`#etiquetaShowOptions${capitalize(col)}`).fadeOut(120);
      $(`#etiquetaShowDisplay${capitalize(col)}`).removeClass('open');
    }
  });

  // Inicialización visual
  updateCabeceraCol(col);
  cargarDropdownEtiquetasCol();
  actualizarCol(col);
}

// --------- Lógica de cabecera por columna ---------
function avanzarPeriodoCol(col, offset) {
  const c = columnas[col];
  if (c.frecuencia === 'rango' && c.start && c.end) {
    const numDias = Math.round((c.end - c.start) / (1000 * 60 * 60 * 24)) + 1;
    let nuevoStart = new Date(c.start);
    let nuevoEnd = new Date(c.end);
    nuevoStart.setDate(c.start.getDate() + offset * numDias);
    nuevoEnd.setDate(c.end.getDate() + offset * numDias);
    c.start = nuevoStart;
    c.end = nuevoEnd;
    document.getElementById(`rangoFechas${capitalize(col)}`)._flatpickr.setDate([c.start, c.end], true);
  } else {
    switch (c.frecuencia) {
      case 'diaria':     c.periodoActual.setDate(c.periodoActual.getDate() + offset); break;
      case 'semanal':    c.periodoActual.setDate(c.periodoActual.getDate() + 7 * offset); break;
      case 'mensual':    c.periodoActual.setMonth(c.periodoActual.getMonth() + offset); break;
      case 'trimestral': c.periodoActual.setMonth(c.periodoActual.getMonth() + 3 * offset); break;
      case 'anual':      c.periodoActual.setFullYear(c.periodoActual.getFullYear() + offset); break;
    }
  }
  updateCabeceraCol(col);
  actualizarCol(col);
}
function resetPeriodoCol(col) {
  const c = columnas[col];
  if (c.frecuencia === 'rango') {
    const hoy = new Date();
    c.start = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    c.end   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    document.getElementById(`rangoFechas${capitalize(col)}`)._flatpickr.setDate([c.start, c.end], true);
  } else {
    c.periodoActual = new Date();
  }
  updateCabeceraCol(col);
  actualizarCol(col);
}
function getPeriodoTextoCol(col) {
  const c = columnas[col];
  if (c.frecuencia === 'rango' && c.start && c.end) {
    return `Del ${c.start.toLocaleDateString('es-ES', optsLong)} al ${c.end.toLocaleDateString('es-ES', optsLong)}`;
  }
  const y = c.periodoActual.getFullYear();
  const m = c.periodoActual.getMonth();
  switch (c.frecuencia) {
    case 'diaria':
      return capitalize(c.periodoActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
    case 'semanal': {
      const start = new Date(c.periodoActual);
      const dd = start.getDay() || 7;
      start.setDate(c.periodoActual.getDate() - dd + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `Semana del ${start.toLocaleDateString('es-ES', optsLong)} al ${end.toLocaleDateString('es-ES', optsLong)}`;
    }
    case 'mensual':
      return capitalize(c.periodoActual.toLocaleDateString('es-ES', optsMonth));
    case 'trimestral': {
      const q = Math.floor(m / 3);
      return `${q + 1}º Trimestre de ${y}`;
    }
    case 'anual':
      return `Año ${y}`;
  }
  return '--';
}
function getResumenLabelCol(col) {
  const c = columnas[col];
  if (c.frecuencia === 'rango') return 'Resumen rango:';
  return `Resumen ${capitalize(frecuencias[c.frecuencia])}:`;
}
function updateCabeceraCol(col) {
  $(`#textoPeriodo${capitalize(col)}`).text(getPeriodoTextoCol(col));
  $(`#labelResumen${capitalize(col)}`).text(getResumenLabelCol(col));
  let irText = "Ir a ";
  switch (columnas[col].frecuencia) {
    case 'diaria':     irText += 'hoy'; break;
    case 'semanal':    irText += 'semana actual'; break;
    case 'mensual':    irText += 'mes actual'; break;
    case 'trimestral': irText += 'trimestre actual'; break;
    case 'anual':      irText += 'año actual'; break;
    case 'rango':      irText += 'mes actual'; break;
  }
  $(`#goToActual${capitalize(col)}`).text(irText);

  if (columnas[col].frecuencia === 'rango') {
    $(`#goToActual${capitalize(col)}`).hide();
  } else {
    $(`#goToActual${capitalize(col)}`).show();
  }
}

// --------- Fechas/rango por columna ---------
function getRangoCol(col) {
  const c = columnas[col];
  if (c.frecuencia === 'rango' && c.start && c.end) {
    return [
      c.start.toISOString().slice(0, 10),
      c.end.toISOString().slice(0, 10)
    ];
  }
  const y = c.periodoActual.getFullYear();
  const m = c.periodoActual.getMonth();
  switch (c.frecuencia) {
    case 'diaria':
      return [c.periodoActual.toISOString().slice(0, 10), c.periodoActual.toISOString().slice(0, 10)];
    case 'semanal': {
      const start = new Date(c.periodoActual);
      const dd = start.getDay() || 7;
      start.setDate(c.periodoActual.getDate() - dd + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    }
    case 'mensual':
      return [
        new Date(y, m, 1).toISOString().slice(0, 10),
        new Date(y, m + 1, 0).toISOString().slice(0, 10)
      ];
    case 'trimestral': {
      const q = Math.floor(m / 3);
      const start = new Date(y, q * 3, 1);
      const end = new Date(y, q * 3 + 3, 0);
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    }
    case 'anual':
      return [
        new Date(y, 0, 1).toISOString().slice(0, 10),
        new Date(y, 11, 31).toISOString().slice(0, 10)
      ];
    default:
      return [null, null];
  }
}

// --------- Actualizar columna/gráficos ---------
function actualizarCol(col) {
  const c = columnas[col];
  let rango = getRangoCol(col);
  let etiqueta = c.etiquetaId || '';
  let params = (rango ? `start=${rango[0]}&end=${rango[1]}` : '') + `&etiqueta_id=${etiqueta}`;
  $.getJSON('../../Pages/Principal/fetchChartData.php?' + params, data => {
    let ingresos = data.income?.total || 0;
    let gastos = data.expense?.total || 0;
    c.ingresos = ingresos;
    c.gastos = gastos;
    $(`#tituloIngresosCol${capitalize(col)}`).html(
    `<span class="chart-label-ing">Ingresos:</span><br>
    <span class="chart-amount-ing">+${formatNumber(ingresos)} €</span>`
    );
    $(`#tituloGastosCol${capitalize(col)}`).html(
    `<span class="chart-label-gas">Gastos:</span><br>
    <span class="chart-amount-gas">-${formatNumber(Math.abs(gastos))} €</span>`
    );

    // Gráfico ingresos
    if (c.chartIngreso) c.chartIngreso.destroy();
    const ctxIng = document.getElementById(`graficoIngreso${capitalize(col)}`).getContext('2d');
    c.chartIngreso = crearPieChart(ctxIng, data.income.labels, data.income.data);

    // Gráfico gastos
    if (c.chartGasto) c.chartGasto.destroy();
    const ctxGas = document.getElementById(`graficoGasto${capitalize(col)}`).getContext('2d');
    c.chartGasto = crearPieChart(ctxGas, data.expense.labels, data.expense.data);

    window.addEventListener('resize', () => {
      const newPosition = getLegendPosition();
      if (c.chartGasto.options.plugins.legend.position !== newPosition) {
        c.chartGasto.options.plugins.legend.position = newPosition;
        c.chartGasto.updateCabeceraCol('izq');
        c.chartGasto.updateCabeceraCol('der');
      }
      if (c.chartIngreso.options.plugins.legend.position !== newPosition) {
        c.chartIngreso.options.plugins.legend.position = newPosition;
        c.chartIngreso.updateCabeceraCol('izq');
        c.chartIngreso.updateCabeceraCol('der');
      }
    });

    actualizarResumenCol(col);
    actualizarBadgeDiferencia();
  });
}
function actualizarResumenCol(col) {
  const c = columnas[col];
  const neto = c.ingresos + c.gastos;
  const $cantidadEl = $(`#cantidadResumen${capitalize(col)}`);
  $cantidadEl.text(`${neto > 0 ? '+ ' : ''}${formatNumber(neto)} €`);
  $cantidadEl.removeClass('positive negative zero');
  $cantidadEl.addClass(neto > 0 ? 'positive' : neto < 0 ? 'negative' : 'zero');
}

function getPeriodoTextoBadge(col) {
  const c = columnas[col];
  if (c.frecuencia === 'rango' && c.start && c.end) {
    return `del ${c.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al ${c.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
  }
  const y = c.periodoActual.getFullYear();
  const m = c.periodoActual.getMonth();
  switch (c.frecuencia) {
    case 'mensual':
      return c.periodoActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    case 'anual':
      return `año ${y}`;
    case 'trimestral': {
      const q = Math.floor(m / 3);
      return `${q + 1}º trimestre de ${y}`;
    }
    case 'semanal': {
      const start = new Date(c.periodoActual);
      const dd = start.getDay() || 7;
      start.setDate(c.periodoActual.getDate() - dd + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `del ${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
    }
    case 'diaria':
      return c.periodoActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    default:
      return '--';
  }
}

function getColorClassForDiff(neto) {
  if (neto > 0) return 'resumen-cantidad positive';
  if (neto < 0) return 'resumen-cantidad negative';
  return 'resumen-cantidad zero';
}

function actualizarBadgeDiferencia() {
  const izq = columnas.izq, der = columnas.der;
  let badge = $('#badgeDiferencia');

  // 1. Calcula el neto/resumen de cada lado
  const resumenIzq = izq.ingresos + izq.gastos;
  const resumenDer = der.ingresos + der.gastos;
  const diff = resumenIzq - resumenDer;

  // 2. Decide color de cantidad
  let colorClass = getColorClassForDiff(diff);

  // 3. Texto de los periodos
  const periodoIzq = getPeriodoTextoBadge('izq');
  const periodoDer = getPeriodoTextoBadge('der');

  // 4. Monta el HTML
  let txt = `
    <div class="diferencia-media" style="color: #222; font-size:1.09rem; text-align:center;">
      La diferencia del resumen de<br><br><span style="font-weight:600;">${periodoIzq}</span> es: <br> 
      <span class="${colorClass}" style="font-size:1.23em;">
        ${diff > 0 ? '+' : (diff < 0 ? '' : '')}${formatNumber(diff)} €
      </span> <br>
      con <span style="font-weight:600;">${periodoDer}</span>.
    </div>
  `;

  badge.html(txt);
  badge.removeClass('dif-ingresos dif-gastos dif-cero');
}

$('#swapColumnsBtn').on('click', function () {


    const $colContainer = $('.comparar-columnas');
    const $colIzq = $colContainer.children('.columna-comparar').eq(0);
    const $colDer = $colContainer.children('.columna-comparar').eq(2);

    if (columnas.izq.chartIngreso) { columnas.izq.chartIngreso.destroy(); columnas.izq.chartIngreso = null; }
    if (columnas.izq.chartGasto)   { columnas.izq.chartGasto.destroy();   columnas.izq.chartGasto   = null; }
    if (columnas.der.chartIngreso) { columnas.der.chartIngreso.destroy(); columnas.der.chartIngreso = null; }
    if (columnas.der.chartGasto)   { columnas.der.chartGasto.destroy();   columnas.der.chartGasto   = null; }

    // Mueve los nodos del DOM (el HTML completo de cada columna)
    $colIzq.insertAfter($colDer);

    // Intercambia también los datos internos de JS
    const temp = Object.assign({}, columnas.izq);
    columnas.izq = Object.assign({}, columnas.der);
    columnas.der = temp;

    // Vuelve a cargar todo lo visual y los gráficos
    updateCabeceraCol('izq');
    updateCabeceraCol('der');
    actualizarCol('izq');
    actualizarCol('der');
    actualizarBadgeDiferencia();

    // Vuelve a crear los iconos lucide por si se pierden
    if (window.lucide) lucide.createIcons();
});


$('#swapColumnsBtn2').on('click', function () {


    const $colContainer = $('.comparar-columnas');
    const $colIzq = $colContainer.children('.columna-comparar').eq(0);
    const $colDer = $colContainer.children('.columna-comparar').eq(2);

    if (columnas.izq.chartIngreso) { columnas.izq.chartIngreso.destroy(); columnas.izq.chartIngreso = null; }
    if (columnas.izq.chartGasto)   { columnas.izq.chartGasto.destroy();   columnas.izq.chartGasto   = null; }
    if (columnas.der.chartIngreso) { columnas.der.chartIngreso.destroy(); columnas.der.chartIngreso = null; }
    if (columnas.der.chartGasto)   { columnas.der.chartGasto.destroy();   columnas.der.chartGasto   = null; }

    // Mueve los nodos del DOM (el HTML completo de cada columna)
    $colIzq.insertAfter($colDer);

    // Intercambia también los datos internos de JS
    const temp = Object.assign({}, columnas.izq);
    columnas.izq = Object.assign({}, columnas.der);
    columnas.der = temp;

    // Vuelve a cargar todo lo visual y los gráficos
    updateCabeceraCol('izq');
    updateCabeceraCol('der');
    actualizarCol('izq');
    actualizarCol('der');
    actualizarBadgeDiferencia();

    // Vuelve a crear los iconos lucide por si se pierden
    if (window.lucide) lucide.createIcons();
});

function getLegendPosition() {
  return window.innerWidth <= 800 ? 'bottom' : 'right';
}


// --------- Gráficos ---------
function crearPieChart(ctx, labels, data) {
  return new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data }] },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        datalabels: {
          display: ctx => {
            const chart = ctx.chart;
            const meta = chart.getDatasetMeta(0);
            const el = meta.data[ctx.dataIndex];
            const value = ctx.dataset.data[ctx.dataIndex];
            if (!el || typeof el.startAngle !== 'number' || typeof el.endAngle !== 'number') return false;
            const labelText = chart.data.labels[ctx.dataIndex];
            const valueText = formatNumber(value) + ' €';
            const text = `${labelText} (${valueText})`;
            const ctx2d = chart.ctx;
            ctx2d.font = '16px sans-serif';
            const textWidth = ctx2d.measureText(text).width;
            const angle = el.endAngle - el.startAngle;
            const avgRadius = (el.innerRadius + el.outerRadius) / 2;
            return angle * avgRadius > textWidth;
          },
          formatter: (value, ctx) => {
            const label = ctx.chart.data.labels[ctx.dataIndex];
            const vals = ctx.chart.data.datasets[0].data;
            const sum = vals.reduce((a, b) => a + b, 0);
            const pct = sum !== 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0.0%';
            const signo = value < 0 ? '-' : '';
            return `${label} (${pct}) \n${signo}${formatNumber(Math.abs(value))} €`;
          },
          color: 'white',
          font: { size: 16 },
          align: 'center',
          anchor: 'center',
          clamp: true,
          lineHeight: 1.2
        },
        legend: {
          position: getLegendPosition(),
          labels: {
            usePointStyle: true,
            padding: 20,
            generateLabels(chart) {
              const data = chart.data.datasets[0].data;
              const colors = chart.data.datasets[0].backgroundColor || Chart.defaults.plugins.colors?.backgroundColor || [];
              const total = data.reduce((a, b) => a + b, 0);
              return chart.data.labels
                .map((label, i) => {
                  const v = data[i];
                  const pct = total !== 0 ? ((v / total) * 100).toFixed(1) + '%' : '0.0%';
                  const signo = v < 0 ? '-' : '';
                  return {
                    text: `${label} (${pct}) ${signo}${formatNumber(Math.abs(v))} €`,
                    value: v,
                    fillStyle: colors[i] || chart.options.elements.arc.backgroundColor?.[i] || '#000',
                    strokeStyle: '#fff',
                    pointStyle: 'circle',
                    lineWidth: 1,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                  };
                })
                .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            }
          }
        },
        tooltip: {
          plugins: {
            tooltip: {
              mode: 'nearest',
              position: 'nearest',
              callbacks: {
                title: items => {
                  const v = items[0].raw;
                  const sum = items[0].dataset.data.reduce((a, b) => a + b, 0);
                  const pct = sum !== 0 ? ((v / sum) * 100).toFixed(1) + '%' : '0.0%';
                  return `${items[0].label} (${pct})`;
                },
                label: ctx => {
                  const v = ctx.raw;
                  const signo = v < 0 ? '-' : '';
                  return `${signo}${formatNumber(Math.abs(v))} €`;
                }
              }
            }
          }
        }
      },
      layout: {
        padding: { top: 20, right: 20, bottom: 20, left: 20 }
      },
      elements: { arc: { clip: false } }
    }

    
  });

  
}

window.reiniciarYcargarComparar = function() {
  updateCabeceraCol('izq');
  updateCabeceraCol('der');
  actualizarCol('izq');
  actualizarCol('der');
  actualizarBadgeDiferencia();
};

// Al final del document ready:
if (window.innerWidth <= 1100) {
  $('.header-mobile').on('click', function(e) {
    // Evita que se abra el calendario o dropdown si el click es en esos elementos
    if ($(e.target).closest('.calendar-btn, .frecuencia-show-display, .frecuencia-show-options').length) return;

    const panel = $(this).data('panel');
    const $graficos = panel === 'izq' ? $('.graficos-izq') : $('.graficos-der');
    $graficos.slideToggle(250); // Animación de slide
    // Opcional: puedes añadir una clase 'abierto' al header si quieres cambiar el icono o color
    $(this).toggleClass('abierto');
  });
}

