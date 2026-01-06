// principal.js

let expenseChart, incomeChart, trendChart;
let selectedEtiquetaId = null; // null = sin filtro de etiqueta
let etiquetasList = [];

let trendChartMode = 'neto'; // Puede ser 'neto' o 'desglose'
let lastTrendData = null; // Para guardar los datos del último fetch

// Formatea números con espacio cada 3 dígitos y decimales opcionales
function formatNumber(num, decimals = 2) {
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

// Registrar DataLabels si están disponibles
if (typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
} else {
  console.error('chartjs-plugin-datalabels no cargado');
}

let currentMonth = new Date();
let selectedFrecuencia = 'mensual';
let customStartDate = null;
let customEndDate = null;

function createPieChart(ctx, labels, data) {
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
          color: 'black',
          font: { size: 16 },
          align: 'center',
          anchor: 'center',
          clamp: true,
          lineHeight: 1.2
        },
        legend: {
          position: 'bottom',
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

function createBarChart(ctx, labels, data, mode = 'neto') { // FIX 1: Añadimos 'mode' como parámetro con un valor por defecto
  let datasets = [];
  let isXStacked = false;
  let isYStacked = false;

  if (mode === 'desglose') {
    // MODO DESGLOSE: dos barras (ingresos, gastos) una al lado de la otra
    isXStacked = false;
    isYStacked = false;
    datasets = [
      {
        label: 'Ingresos',
        data: data.map(d => d?.ingresos > 0 ? d.ingresos : null),
        backgroundColor: 'rgba(0, 255, 0, 0.7)',
        barPercentage: 0.9,
        categoryPercentage: 0.5, // Deja espacio para la otra barra
        datalabels: {
          color: 'black',
          display: ctx => ctx.dataset.data[ctx.dataIndex] != null,
          formatter: v => v != null ? formatNumber(v) + ' €' : ''
        }
      },
      {
        label: 'Gastos',
        data: data.map(d => d?.gastos > 0 ? d.gastos : null),
        backgroundColor: 'rgba(252, 0, 0, 0.7)',
        barPercentage: 0.9,
        categoryPercentage: 0.5,
        datalabels: {
          color: 'black',
          display: ctx => ctx.dataset.data[ctx.dataIndex] != null,
          formatter: v => v != null ? formatNumber(v) + ' €' : ''
        }
      }
    ];
  } else {
    // MODO NETO (como estaba antes, pero usando los nuevos datos)
    isXStacked = true;
    isYStacked = true;
    const positivos = data.map(v => v && v.neto !== null && v.neto >= 0 ? v.neto : null);
    const negativos = data.map(v => v && v.neto !== null && v.neto < 0 ? v.neto : null);

    datasets = [
      {
        label: 'Días positivos',
        data: positivos,
        backgroundColor: 'rgba(0, 255, 0, 0.7)',
        barPercentage: 0.9,
        categoryPercentage: 1.0,
        datalabels: {
          color: 'black',
          display: ctx => ctx.dataset.data[ctx.dataIndex] != null,
          formatter: v => v != null ? formatNumber(v) + ' €' : ''
        }
      },
      {
        label: 'Días negativos',
        data: negativos,
        backgroundColor: 'rgba(252, 0, 0, 0.7)',
        barPercentage: 0.9,
        categoryPercentage: 1.0,
        datalabels: {
          color: 'black',
          display: ctx => ctx.dataset.data[ctx.dataIndex] != null,
          formatter: v => v != null ? formatNumber(v) + ' €' : ''
        }
      }
    ];
  }

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets // FIX 2: Usamos la variable 'datasets' que hemos preparado en el if/else
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 12
          }
        },
        datalabels: {
          color: 'black',
          display: ctx => ctx.dataset.data[ctx.dataIndex] != null,
          formatter: v => v != null ? formatNumber(v) + ' €' : '',
          font: { weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              if (selectedFrecuencia === 'trimestral' || selectedFrecuencia === 'anual') {
                return 'Ir al mes';
              }
              return 'Ir al día';
            },
            // Pequeña mejora para que el tooltip muestre el valor correcto en ambos modos
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += formatNumber(context.parsed.y) + ' €';
                }
                return label;
            }
          }
        }
      },
      scales: {
        x: {
          barPercentage: 0.9,
          categoryPercentage: 1.0,
          position: 'top',
          stacked: isXStacked,
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          stacked: isYStacked,
          grid: {
            drawBorder: false,
            drawOnChartArea: true,
            drawTicks: false,
            color: context => context.tick.value === 0 ? '#ccc' : 'transparent'
          }
        }
      },
      onClick: function(evt, elements) {
        if (elements && elements.length) {
          const idx = elements[0].index;
          const clickedLabel = this.data.labels[idx];
          let targetDate = null;
          let nuevaFrecuencia = selectedFrecuencia;
          let updateDropdownText = '';

          if (selectedFrecuencia === 'mensual' || (customStartDate && customEndDate)) {
            let targetDay, targetMonth, targetYear;
            if (labels[idx].includes('/')) {
              [targetDay, targetMonth] = labels[idx].split('/').map(Number);
              targetYear = customStartDate ? customStartDate.getFullYear() : currentMonth.getFullYear();
            } else {
              targetDay = Number(labels[idx]);
              targetMonth = customStartDate ? customStartDate.getMonth() + 1 : currentMonth.getMonth() + 1;
              targetYear = customStartDate ? customStartDate.getFullYear() : currentMonth.getFullYear();
            }
            targetDate = new Date(targetYear, targetMonth - 1, targetDay);
            nuevaFrecuencia = 'diaria';
            updateDropdownText = 'Diaria';
          } else if (selectedFrecuencia === 'semanal') {
            const startDate = new Date(currentMonth);
            const dd = currentMonth.getDay() || 7;
            startDate.setDate(currentMonth.getDate() - dd + 1);
            targetDate = new Date(startDate);
            targetDate.setDate(startDate.getDate() + idx);
            nuevaFrecuencia = 'diaria';
            updateDropdownText = 'Diaria';
          } 
          else if (selectedFrecuencia === 'trimestral' || selectedFrecuencia === 'anual') 
          {
            const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            const mes = monthNames.findIndex(m => clickedLabel.toLowerCase().startsWith(m));
            if (mes >= 0) 
            {
              const year = currentMonth.getFullYear();
              targetDate = new Date(year, mes, 1);
              nuevaFrecuencia = 'mensual';
              updateDropdownText = 'Mensual';
            } else {
              return;
            }
          } else 
          {
            return;
          }

          selectedFrecuencia = nuevaFrecuencia;
          currentMonth = targetDate;
          customStartDate = customEndDate = null;
          updateCharts();

          $('#frecuenciaShowDisplay').text(updateDropdownText.charAt(0).toUpperCase() + updateDropdownText.slice(1));
          $('#frecuenciaShowOptions li').removeClass('active');
          $('#frecuenciaShowOptions li[data-value="' + nuevaFrecuencia + '"]').addClass('active');
        }
      },
      hover: {
        onHover: function(event, elements) {
          const canvas = event?.native?.target || event.target;
          canvas.style.cursor = (elements && elements.length) ? "pointer" : "default";
        }
      }
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateStickyResumen(label, cantidad, clase) {
  const stickyLabelEl = document.getElementById('stickyResumenLabel');
  const stickyCantidadEl = document.getElementById('stickyResumenCantidad');
  if (stickyLabelEl && stickyCantidadEl) {
    stickyLabelEl.textContent = label;
    stickyCantidadEl.textContent = cantidad;
    stickyCantidadEl.classList.remove('positive', 'negative', 'zero');
    if (clase) stickyCantidadEl.classList.add(clase);
  }
}

window.updateCharts = function updateCharts() {
  const resumenTextMap = {
    diaria:     'Resumen diario:  ',
    semanal:    'Resumen semanal:  ',
    mensual:    'Resumen mensual:  ',
    trimestral: 'Resumen trimestral:  ',
    anual:      'Resumen anual:  ',
    rango:      'Resumen del rango:  '
  };

  const goToTextMap = {
    diaria:     'Ir a hoy',
    semanal:    'Ir a semana actual',
    mensual:    'Ir a mes actual',
    trimestral: 'Ir a trimestre actual',
    anual:      'Ir a año actual',
    rango:      'Ir a rango actual',
  };

  const goToTodayTextEl = document.getElementById('goToTodayText');
  if (goToTodayTextEl) goToTodayTextEl.textContent = goToTextMap[selectedFrecuencia] || 'Hoy';
  const resumenEl = document.getElementById('monthlySummary');
  if (resumenEl) resumenEl.textContent = resumenTextMap[selectedFrecuencia] || 'Resumen';

  let startDate, endDate, currentTitle = '';
  if (customStartDate && customEndDate) {
    startDate   = customStartDate;
    endDate     = customEndDate;
    const opts  = { day: 'numeric', month: 'long' };
    currentTitle = `Del ${startDate.toLocaleDateString('es-ES', opts)} al ${endDate.toLocaleDateString('es-ES', opts)}`;
  } else {
    const today = new Date(currentMonth);
    const y     = today.getFullYear();
    const m     = today.getMonth();
    switch (selectedFrecuencia) {
      case 'diaria':
        startDate = endDate = new Date(today);
        const ayer = new Date(today); ayer.setDate(ayer.getDate() - 1);
        const fmt  = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        if (today.toDateString() === new Date().toDateString()) {
          currentTitle = `Hoy (${fmt})`;
        } else if (today.toDateString() === ayer.toDateString()) {
          currentTitle = `Ayer (${fmt})`;
        } else {
          currentTitle = capitalize(fmt);
        }
        break;
      case 'semanal': {
        const inicio = new Date(today);
        const dd     = today.getDay() || 7;
        inicio.setDate(today.getDate() - dd + 1);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        startDate   = inicio;
        endDate     = fin;
        currentTitle = `Semana del ${inicio.toLocaleDateString('es-ES',{ day:'numeric', month:'long' })} al ${fin.toLocaleDateString('es-ES',{ day:'numeric', month:'long' })}`;
        break;
      }
      case 'mensual':
        startDate   = new Date(y, m, 1);
        endDate     = new Date(y, m + 1, 0);
        currentTitle = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        break;
      case 'trimestral': {
        const q = Math.floor(m / 3);
        startDate   = new Date(y, q * 3, 1);
        endDate     = new Date(y, q * 3 + 3, 0);
        currentTitle = `${q + 1}º Trimestre de ${y}`;
        break;
      }
      case 'anual':
        startDate   = new Date(y, 0, 1);
        endDate     = new Date(y, 11, 31);
        currentTitle = `Año ${y}`;
        break;
    }
  }

  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  if (prevBtn) prevBtn.disabled = false;
  if (nextBtn) nextBtn.disabled = false;
  
  const startStr = startDate.toLocaleDateString('sv-SE');
  const endStr   = endDate.toLocaleDateString('sv-SE');
  document.getElementById('currentMonthText').textContent = currentTitle;

  $.getJSON(
    `fetchChartData.php?start=${startStr}&end=${endStr}` +
    `&frecuencia=${selectedFrecuencia}` +
    (selectedEtiquetaId ? `&etiqueta_id=${selectedEtiquetaId}` : ""),
    data => {
      if (expenseChart) expenseChart.destroy();
      if (incomeChart)  incomeChart.destroy();
      const expCtx = document.getElementById('expensesChart').getContext('2d');
      const incCtx = document.getElementById('incomeChart').getContext('2d');
      expenseChart = createPieChart(expCtx, data.expense.labels, data.expense.data);
      incomeChart  = createPieChart(incCtx, data.income.labels,  data.income.data);

      document.getElementById('expensesTotal').textContent = "-" + formatNumber(data.expense.total) + ' €';
      document.getElementById('incomeTotal').textContent   = "+ " + formatNumber(data.income.total) + ' €';

      const sinI    = data.income.total === 0;
      const sinG    = data.expense.total === 0;
      const noMovEl = document.getElementById('noMovimientos');
      const trendEl = document.getElementById('trendChartContainer');
      const wrapper = document.querySelector('.charts-wrapper');

      if (sinI && sinG) {
        noMovEl.style.display = 'flex';
        let mensaje = 'Todavía no tienes ningún movimiento.';
        if (!data.hasAnyMovements) {
          if (selectedEtiquetaId) {
            mensaje = 'No tienes ningún movimiento con esta etiqueta.';
          }
        }
        noMovEl.querySelector('p').textContent = data.hasAnyMovements
          ? 'No hay ningún movimiento en este rango de fechas.'
          : mensaje;

        document.querySelectorAll('.chart-box').forEach(el => el.style.display = 'none');
        trendEl.style.display = 'none';
        if (wrapper) wrapper.style.display = 'none';

        document.getElementById('expensesTotal').textContent = '-- €';
        document.getElementById('incomeTotal').textContent   = '-- €';
        const netEl = document.getElementById('monthlyNet');
        netEl.textContent = '-- €';
        netEl.classList.remove('positive', 'negative', 'zero');
        updateStickyResumen('Resumen:', '-- €', '');
        return;
      } else {
        noMovEl.style.display = 'none';
        document.querySelectorAll('.chart-box').forEach(el => el.style.display = 'block');
        if (wrapper) wrapper.style.display = 'flex';
      }

      const net = data.income.total + data.expense.rawTotal;
      const netEl = document.getElementById('monthlyNet');
      netEl.textContent = `${formatNumber(net)} €`;
      netEl.classList.remove('positive','negative','zero');
      netEl.classList.add(net > 0 ? 'positive' : net < 0 ? 'negative' : 'zero');
      updateStickyResumen(
        resumenTextMap[selectedFrecuencia]?.replace(':  ', ':') ?? 'Resumen:',
        netEl.textContent,
        netEl.classList.contains('positive') ? 'positive'
          : netEl.classList.contains('negative') ? 'negative'
          : 'zero'
      );

      setTimeout(() => {
        expenseChart.resize(); expenseChart.update();
        incomeChart.resize();  incomeChart.update();
      }, 150);

      let group = selectedFrecuencia;
      let numDiasRango = 0;

      if (customStartDate && customEndDate) {
        group = 'mensual';
        numDiasRango = Math.floor((customEndDate - customStartDate) / (1000 * 60 * 60 * 24)) + 1;
      }

      let labels = [], values = [];
      const trendMap = {};
      data.trend.labels.forEach((periodo, idx) => {
        trendMap[periodo] = data.trend.data[idx];
      });

      const numMaximoDias = 42;

      if (customStartDate && customEndDate) {
        let d = new Date(customStartDate);
        let count = 0;
        while (d <= customEndDate && count < numMaximoDias) {
          const key = d.toLocaleDateString('sv-SE');
          labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' }));
          values.push(trendMap[key] ?? { neto: null, ingresos: null, gastos: null });
          d.setDate(d.getDate() + 1);
          count++;
        }

        $("#trendChartContainer .barras-aviso").remove();
        if (numDiasRango > numMaximoDias) {
          $('#trendChartContainer').append(`
            <div class="barras-aviso">
              El máximo de días posibles es de ${numMaximoDias}. <br> Se mostrarán solo los ${numMaximoDias} primeros.
            </div>
          `);
        }
      } else {
        switch (group) {
          case 'semanal':
            for (let i = 0; i < 7; i++) {
              const d = new Date(startDate);
              d.setDate(startDate.getDate() + i);
              const key = d.toLocaleDateString('sv-SE');
              labels.push(d.toLocaleDateString('es-ES', { weekday: 'short' }));
              values.push(trendMap[key] ?? null);
            }
            break;
          case 'mensual':
            for (let d = 1; d <= endDate.getDate(); d++) {
              const realDate = new Date(startDate.getFullYear(), startDate.getMonth(), d);
              const key = realDate.toLocaleDateString('sv-SE');
              labels.push(d.toString());
              values.push(trendMap[key] ?? null);
            }
            break;
          case 'trimestral': {
            let month = startDate.getMonth();
            while (month <= endDate.getMonth()) {
              const dt = new Date(startDate.getFullYear(), month, 1);
              const key = `${dt.getFullYear()}-${String(month+1).padStart(2,'0')}`;
              labels.push(dt.toLocaleDateString('es-ES', { month: 'short' }));
              values.push(trendMap[key] ?? null);
              month++;
            }
            break;
          }
          case 'anual':
            labels = [];
            values = [];
            for (let mes = 0; mes < 12; mes++) {
              const dt  = new Date(startDate.getFullYear(), mes, 1);
              // Construye la clave YYYY-MM explícitamente para asegurar coincidencia con PHP
              const key = `${dt.getFullYear()}-${String(mes + 1).padStart(2, '0')}`;
              labels.push(dt.toLocaleDateString('es-ES', { month: 'short' }));
              values.push(trendMap[key] ?? null);
              // console.log(`Anual loop: mes=${mes}, dt=${dt.toDateString()}, key=${key}, label=${labels[labels.length-1]}, value=${values[values.length-1]}`); // Debugging
            }
            break;
        }
        $("#trendChartContainer .barras-aviso").remove();
      }

      const trendTitleEl = document.getElementById('trendChartTitle').querySelector('.title');
      trendTitleEl.textContent = (group === 'mensual' || group === 'semanal')
        ? 'Desglose diario'
        : 'Desglose mensual';

      if (group === 'diaria') {
        document.getElementById('stickyLimit').style.display = 'none';
        document.getElementById('trendChartsContainer').style.display = 'none';
        if (trendChart) trendChart.destroy();
      } else {
        document.getElementById('stickyLimit').style.display = 'block';
        document.getElementById('trendChartsContainer').style.display = 'block';

        lastTrendData = { labels, data: values }; // Guardamos los datos

        const trendEl = document.getElementById('trendChartContainer');
        trendEl.style.display = 'block';
        const ctx2 = document.getElementById('trendChart').getContext('2d');
        if (trendChart) trendChart.destroy();
        trendChart = createBarChart(ctx2, lastTrendData.labels, lastTrendData.data, trendChartMode);
      }
    }
  );
}

function showSuccessAlertBar(text) {
  $('.success-alert').remove();
  const $alert = $('<div class="success-alert"></div>').text(text);
  $('body').append($alert);
  $alert
    .slideDown(300)
    .delay(2000)
    .slideUp(300, function() { $(this).remove(); });
}

document.addEventListener('DOMContentLoaded', (e) => {
  lucide.createIcons();
  updateCharts();

  document.getElementById('trendChartSwitch').addEventListener('change', function() {
        trendChartMode = this.checked ? 'desglose' : 'neto';

        // Si ya hay un gráfico y tenemos datos, lo redibujamos sin hacer otra llamada a la API
        if (trendChart && lastTrendData) {
            const ctx = document.getElementById('trendChart').getContext('2d');
            trendChart.destroy();
            trendChart = createBarChart(ctx, lastTrendData.labels, lastTrendData.data, trendChartMode);
        }
    });

  const container = document.querySelector('.frecuencia-show-dropdown').closest('.input-container');

  $('#frecuenciaShowDisplay').on('click', function (e) {
    e.stopPropagation();
    $('#frecuenciaShowOptions').fadeToggle(150);
    $(this).toggleClass('open');
    container.classList.toggle('open');
  });

  $('#frecuenciaShowOptions li').on('click', function (e) {
    e.stopPropagation();
    const value = $(this).data('value');
    if (value === 'rango') {
      // Abre el calendario
      $('#frecuenciaShowOptions').fadeOut(150);
      $('#frecuenciaShowDisplay').removeClass('open');
      container.classList.remove('open');
      document.getElementById('rangoFechas')._flatpickr.open();
      // No cambies la frecuencia aquí, solo cuando el usuario elija fechas
      return;
    }
    selectedFrecuencia = value;
    $('#frecuenciaShowDisplay').text(capitalize(selectedFrecuencia)).removeClass('open');
    $('#frecuenciaShowOptions').fadeOut(150);
    container.classList.remove('open');
    customStartDate = customEndDate = null;
    if (document.getElementById('rangoFechas')._flatpickr) {
        document.getElementById('rangoFechas')._flatpickr.clear();
    }
    updateCharts();
  });

  document.addEventListener('click', function (e) {
    const display = document.getElementById('frecuenciaShowDisplay');
    const options = document.getElementById('frecuenciaShowOptions');
    if (!display.contains(e.target) && !options.contains(e.target)) {
      options.style.display = 'none';
      display.classList.remove('open');
      container.classList.remove('open');
    }
  });

  flatpickr("#rangoFechas", {
    mode: "range",
    dateFormat: "Y-m-d",
    locale: "es",
    positionElement: document.getElementById('customDateBtn'),
    onClose: dates => {
      if (dates.length === 2) {
        customStartDate = dates[0];
        customEndDate   = dates[1];
        selectedFrecuencia = 'rango';
        $('#frecuenciaShowDisplay').text('Rango personalizado');
        $('#frecuenciaShowOptions li').removeClass('active');
        $('#frecuenciaShowOptions li[data-value="rango"]').addClass('active');
        updateCharts();
      }
    }
  });

  document.getElementById('customDateBtn').addEventListener('click', () =>
    document.getElementById('rangoFechas')._flatpickr.open()
  );

  document.getElementById('prevMonth').addEventListener('click', () => { avanzarFecha(-1); });
  document.getElementById('nextMonth').addEventListener('click', () => { avanzarFecha(1); });
  document.getElementById('goToTodayText').addEventListener('click', () => {
   if (selectedFrecuencia === 'rango') {
      // Si ya hay un rango seleccionado, calcular el nuevo rango manteniendo la misma duración
      if (customStartDate && customEndDate) {
        const hoy = new Date();
        const diffDias = Math.round((customEndDate - customStartDate) / (1000 * 60 * 60 * 24));
        
        customStartDate = new Date(hoy);
        customEndDate = new Date(hoy);
        customEndDate.setDate(hoy.getDate() + diffDias);
        
        // Actualizar el datepicker si existe
        if (document.getElementById('rangoFechas')._flatpickr) {
          document.getElementById('rangoFechas')._flatpickr.setDate([customStartDate, customEndDate], true);
        }
      } else {
        // Si no hay rango seleccionado, ir a hoy (comportamiento por defecto)
        currentMonth = new Date();
        customStartDate = customEndDate = null;
      }
    } else {
      // Para otras frecuencias, comportamiento normal
      currentMonth = new Date();
      customStartDate = customEndDate = null;
    }
    
    window.updateCharts();
  });

  const ms = document.querySelector('.month-selector');
  const resumenEl = document.getElementById('stickyResumen');
  const firstChartBox = document.getElementById('circularCharts');
  const origOffset = ms.offsetTop;

  window.addEventListener('scroll', () => {
    const netText   = document.getElementById('monthlyNet').textContent;

    if (window.pageYOffset >= origOffset + 50) {
      ms.classList.add('stuck');
      resumenEl.style.display = 'block';
      if (firstChartBox) firstChartBox.classList.add('radius');
      const cantidadEl = document.getElementById('stickyResumenCantidad');
      cantidadEl.textContent = netText;
      cantidadEl.classList.remove('positive', 'negative', 'zero');
      const netEl = document.getElementById('monthlyNet');
      if (netEl.classList.contains('positive')) cantidadEl.classList.add('positive');
      else if (netEl.classList.contains('negative')) cantidadEl.classList.add('negative');
      else cantidadEl.classList.add('zero');
    } else {
      ms.classList.remove('stuck');
      resumenEl.style.display = 'none';
      if (firstChartBox) firstChartBox.classList.remove('radius');
    }
  });



    let fullscreenChartInstance = null;

    // Al hacer clic en "Ampliar"
    // Al hacer clic en "Ampliar"
    $('#btnExpandir').on('click', function() {
      if (!lastTrendData) return; // Si no hay datos, no hacemos nada

      // 1. Mostrar el modal
      $('#chartModal').fadeIn(200);

      // 2. Destruir gráfico anterior si existe para evitar superposiciones
      if (fullscreenChartInstance) {
        fullscreenChartInstance.destroy();
      }

      // 3. PREPARAR DATASETS (Corrección aplicada aquí)
      // Reconstruimos los datasets basándonos en el modo actual (Neto o Desglose)
      // usando los datos crudos de lastTrendData.data
      
      let datasets = [];
      const rawData = lastTrendData.data;

      if (trendChartMode === 'desglose') {
        // --- MODO DESGLOSE (Ingresos vs Gastos) ---
        datasets = [
          {
            label: 'Ingresos',
            data: rawData.map(d => d?.ingresos > 0 ? d.ingresos : null),
            backgroundColor: 'rgba(0, 255, 0, 0.7)',
            barPercentage: 0.8,
            categoryPercentage: 0.8,
            datalabels: {
               color: 'black',
               anchor: 'end',
               align: 'end',
               formatter: v => v != null ? formatNumber(v) + ' €' : ''
            }
          },
          {
            label: 'Gastos',
            data: rawData.map(d => d?.gastos > 0 ? d.gastos : null),
            backgroundColor: 'rgba(252, 0, 0, 0.7)',
            barPercentage: 0.8,
            categoryPercentage: 0.8,
            datalabels: {
               color: 'black',
               anchor: 'end',
               align: 'end',
               formatter: v => v != null ? formatNumber(v) + ' €' : ''
            }
          }
        ];
      } else {
        // --- MODO NETO (Positivos vs Negativos) ---
        const positivos = rawData.map(v => v && v.neto !== null && v.neto >= 0 ? v.neto : null);
        const negativos = rawData.map(v => v && v.neto !== null && v.neto < 0 ? v.neto : null);

        datasets = [
          {
            label: 'Positivos',
            data: positivos,
            backgroundColor: 'rgba(0, 255, 0, 0.7)',
            barPercentage: 0.8, 
            categoryPercentage: 1.0, 
            datalabels: {
               color: 'black',
               anchor: 'end', // Ponemos la etiqueta al final de la barra
               align: 'end',
               formatter: v => v != null ? formatNumber(v) + ' €' : ''
            }
          },
          {
            label: 'Negativos',
            data: negativos,
            backgroundColor: 'rgba(252, 0, 0, 0.7)',
            barPercentage: 0.8, 
            categoryPercentage: 1.0, 
            datalabels: {
               color: 'black',
               anchor: 'start', // Ajuste visual para barras negativas
               align: 'start',
               formatter: v => v != null ? formatNumber(v) + ' €' : ''
            }
          }
        ];
      }

      const ctx = document.getElementById('fullscreenCanvas').getContext('2d');

      // 4. Crear el gráfico HORIZONTAL
      fullscreenChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: lastTrendData.labels,
          datasets: datasets
        },
        options: {
          indexAxis: 'y', // <--- ESTA ES LA CLAVE: Gira el gráfico a horizontal
          responsive: true,
          maintainAspectRatio: false, // Importante para que llene la pantalla
          animation: false, // Para que cargue rápido
          plugins: {
            legend: { position: 'top' },
            title: { 
              display: true, 
              text: trendChartMode === 'desglose' ? 'Visión Detallada (Ingresos/Gastos)' : 'Visión Detallada (Neto)',
              font: { size: 16 }
            },
            datalabels: {
               display: true, // Aseguramos que se vean los números
               font: { weight: 'bold' }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.x !== null) { // Nota: es .x porque está girado
                            label += formatNumber(context.parsed.x) + ' €';
                        }
                        return label;
                    }
                }
            }
          },
          scales: {
            x: { // Eje horizontal (ahora representa el dinero)
              beginAtZero: true,
              grid: { color: '#eee' },
              position: 'top' // Poner los números de dinero arriba para mejor lectura
            },
            y: { // Eje vertical (ahora representa las fechas)
              stacked: (trendChartMode === 'neto'), // Apilar solo si es modo neto
              ticks: {
                autoSkip: false, // Importante: MOSTRAR TODAS las etiquetas
                font: { size: 11 } 
              },
              grid: { display: false }
            }
          }
        }
      });
    });

    // Al cerrar el modal
    $('#closeModal').on('click', function() {
      $('#chartModal').fadeOut(200);
      // Opcional: destruir instancia para liberar memoria
      if (fullscreenChartInstance) {
        fullscreenChartInstance.destroy();
        fullscreenChartInstance = null;
      }
    });
});

function avanzarFecha(offset) {
  if (customStartDate && customEndDate) {
    const numDias = Math.round((customEndDate - customStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const nuevoStart = new Date(customStartDate);
    const nuevoEnd = new Date(customEndDate);
    nuevoStart.setDate(nuevoStart.getDate() + offset * numDias);
    nuevoEnd.setDate(nuevoEnd.getDate() + offset * numDias);
    customStartDate = nuevoStart;
    customEndDate = nuevoEnd;
    if (document.getElementById('rangoFechas')._flatpickr) {
      document.getElementById('rangoFechas')._flatpickr.setDate([customStartDate, customEndDate], true);
    }
    updateCharts();
    return;
  }
  switch (selectedFrecuencia) {
    case 'diaria':    currentMonth.setDate(currentMonth.getDate() + offset); break;
    case 'semanal':   currentMonth.setDate(currentMonth.getDate() + 7 * offset); break;
    case 'mensual':   currentMonth.setMonth(currentMonth.getMonth() + offset); break;
    case 'trimestral':currentMonth.setMonth(currentMonth.getMonth() + 3 * offset); break;
    case 'anual':     currentMonth.setFullYear(currentMonth.getFullYear() + offset); break;
  }
  customStartDate = customEndDate = null;
  updateCharts();
}

$(document).ajaxSuccess((e, xhr, settings) => {
  if (settings.url.includes('conexionPrincipal.php') || settings.url.includes('tuInsertMovimiento.php')) {
    updateCharts();
  }
});

function showSuccessMessage(text) {
    // Si ya existe, lo quitamos antes
    $('.success-alert').remove();

    // Creamos el div y lo preparamos
    const $alert = $('<div class="success-alert"></div>').text(text);
    $('body').append($alert);

    // Slide down, esperar 3s, slide up y quitar
    $alert
      .slideDown(300)
      .delay(2000)
      .slideUp(300, function() { $(this).remove(); });
  }

  
