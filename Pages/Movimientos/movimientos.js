// movimientos.js
let cargando = false;
let noMasDatos = false;
let filtros = {
  concepto_id: "",
  etiqueta_id: "",
  fecha_inicio: "",
  fecha_fin: ""
};
let offset = 0;
let loadingSpinner = $(`
  <div id="movimientosLoading" style="text-align:center; padding: 60px 20px;">
    <div style="font-size: 1.8rem; color: black; font-weight: 200; margin-bottom: 25px;">
      Cargando movimientos
    </div>
    <div class="spinner-grande" style="width: 48px; height: 48px;"></div>
  </div>
`);
let movimientoEditandoId = null;

// Mapa para mantener los movimientos por día y su resumen
let allMovimientosPorDia = {};

window.cargarMovimientos = function() {
  if (cargando || noMasDatos) return;
  cargando = true;
  $('#movimientosList').append(loadingSpinner);
  $('#noMovimientosMsg').hide(); 

  let query = 'fetchMovimientos.php';
  let params = [];
  params.push(`offset=${offset}`);
  params.push(`limit=${20}`);
  if (filtros.concepto_id) params.push(`concepto_id=${encodeURIComponent(filtros.concepto_id)}`);
  if (filtros.etiqueta_id) params.push(`etiqueta_id=${encodeURIComponent(filtros.etiqueta_id)}`);
  if (filtros.fecha_inicio) params.push(`fecha_inicio=${encodeURIComponent(filtros.fecha_inicio)}`);
  if (filtros.fecha_fin) params.push(`fecha_fin=${encodeURIComponent(filtros.fecha_fin)}`);
  if (params.length > 0) query += '?' + params.join('&');

  $.getJSON(query, function(resp) {
    loadingSpinner.detach();
    cargando = false;
    if (!resp.success) {
      $('#movimientosList').append(`<div style="color:red;padding:30px;">Error: ${resp.error || "Error al cargar movimientos"}</div>`);
      noMasDatos = true;
      return;
    }

    if (Object.keys(resp.data).length === 0) {
      if (offset === 0) {
        $('#movimientosList').hide();
        $('#noMovimientosMsg').show();
      }
      noMasDatos = true;
      return;
    }
    
    $('#noMovimientosMsg').hide();
    $('#movimientosList').show();

    // Renderizar los movimientos y actualizar el estado
    window.renderizarMovimientos(resp.data);
    
    // Actualizar el offset para la siguiente petición
    const totalMostradosEnEsteBloque = Object.values(resp.data).reduce((sum, arr) => sum + arr.length, 0);
    offset += totalMostradosEnEsteBloque;

  }).fail(function(jqXHR, textStatus, errorThrown) {
    loadingSpinner.detach();
    cargando = false;
    $('#movimientosList').append(`<div style="color:red;padding:30px;">Error de red: ${textStatus}</div>`);
  });
};

window.renderizarMovimientos = function(dataPorDia) {
  for (const fecha in dataPorDia) {
    if (!dataPorDia.hasOwnProperty(fecha)) continue;

    // Actualizamos el mapa global para que se pueda usar para la edición
    if (!allMovimientosPorDia[fecha]) allMovimientosPorDia[fecha] = [];
    allMovimientosPorDia[fecha] = allMovimientosPorDia[fecha].concat(dataPorDia[fecha]);

    let $diaExistente = $(`.movimientos-dia[data-fecha="${fecha}"]`);
    let $lista;
    if ($diaExistente.length === 0) {
      const dateObj = new Date(fecha + 'T00:00:00'); // Evitar problemas de zona horaria
      const fechaTexto = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const header = `
        <div class="mov-dia-header">
          <div class="movimientos-dia-fecha">${fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1)}</div>
          <div class="mov-dia-resumen">
            <span>Resumen diario: </span>
            <span class="mov-dia-cantidad"></span>
          </div>
        </div>
        <div class="mov-row-header">
          <div class="mov-header-col">Cantidad</div>
          <div class="mov-header-col">Concepto</div>
          <div class="mov-header-col">Etiquetas</div>
          <div class="mov-header-col">Observaciones</div>
          <div class="mov-header-col">Imagen</div>
          <div class="mov-header-col" style="flex:0 0 46px;"></div>
        </div>
        <div class="lista-mov-dia"></div>
      `;
      $diaExistente = $(`<div class="movimientos-dia" data-fecha="${fecha}">${header}</div>`);
      $lista = $diaExistente.find('.lista-mov-dia');
      $('#movimientosList').append($diaExistente);
      
      const $resumen = $diaExistente.find('.mov-dia-resumen');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          $resumen.toggleClass('sticky', !entry.isIntersecting);
        });
      }, {threshold: [0, 1]});
      observer.observe($diaExistente[0]);

    } else {
      $lista = $diaExistente.find('.lista-mov-dia');
    }
    
    // Actualizar el resumen del día con el total de todos los movimientos del día
    let totalDia = allMovimientosPorDia[fecha].reduce((acc, mov) => acc + parseFloat(mov.cantidad), 0);
    let resumenColor = totalDia > 0 ? 'positivo' : (totalDia < 0 ? 'negativo' : 'cero');
    let resumenTxt = (totalDia > 0 ? '+' : (totalDia < 0 ? '' : '')) + Math.abs(totalDia).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) + " €";
    $diaExistente.find('.mov-dia-cantidad')
      .removeClass('positivo negativo cero')
      .addClass(resumenColor)
      .text(resumenTxt);

    // Renderizar los nuevos movimientos
    dataPorDia[fecha].forEach(mov => {
      const cantidadClass = parseFloat(mov.cantidad) > 0 ? 'movimiento-cantidad ingreso' : 'movimiento-cantidad gasto';
      
      let etiquetasHtml = '';
      if (mov.etiquetas && mov.etiquetas.length > 0) {
        etiquetasHtml = mov.etiquetas.map(e =>
          `<span class="chip-etiqueta">${e.nombre}</span>`
        ).join('');
      }

      const obsHtml = (mov.observaciones && mov.observaciones.trim().length > 0)
        ? `<div class="observaciones">${mov.observaciones}</div>` : '';

      let imgHtml = '';
      if (mov.imagen && typeof mov.imagen === 'string' && mov.imagen.trim() !== '' && mov.imagen.toLowerCase() !== 'null') {
        let imgPath = mov.imagen.trim();
        imgHtml = `
          <img 
            src="${imgPath}" 
            class="mov-img-thumb"
            alt="Imagen movimiento"
            data-img-full="${imgPath}"
          />
        `;
      }

      function getMonedaSymbol(moneda) {
        switch (moneda) {
          case 'EUR': return '€';
          case 'USD': return '$';
          case 'GBP': return '£';
          case 'JPY': return '¥';
          default: return moneda || '€';
        }
      }

      $lista.append(`
        <div class="movimiento-row" data-id="${mov.id}">
          <div class="mov-col">
            <div class="${cantidadClass}">${parseFloat(mov.cantidad).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} ${getMonedaSymbol(mov.moneda)}</div>
          </div>
          <div class="mov-col">
            <div class="movimiento-concepto">${mov.concepto}</div>
          </div>
          <div class="mov-col">
            ${etiquetasHtml}
          </div>
          <div class="mov-col">
            ${obsHtml}
          </div>
          <div class="mov-col mov-col-img">
            ${imgHtml}
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button class="mov-action-btn editar-mov-btn" data-id="${mov.id}" title="Editar movimiento">
              <i data-lucide="pencil"></i>
            </button>
            <button class="mov-action-btn eliminar-mov-btn" data-id="${mov.id}" title="Eliminar movimiento">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `);
    });
  }

  lucide.createIcons();
  
  if (movimientoEditandoId !== null) {
      $('.editar-mov-btn').each(function() {
          if ($(this).data('id') != movimientoEditandoId) {
              $(this).hide();
          }
      });
  }
};

window.reiniciarYcargar = function(scrollToY = null) {
  $('#movimientosList').empty();
  offset = 0;
  noMasDatos = false;
  allMovimientosPorDia = {}; 
  window.cargarMovimientos();
  if (scrollToY !== null) {
    window.scrollTo(0, scrollToY);
  }
};

$(function () {
  // Cargar movimientos al inicio
  window.cargarMovimientos();

  // Scroll infinito
  $(window).on('scroll', function() {
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 200) {
      window.cargarMovimientos();
    }
  });

  // Otras funciones de eventos...
});