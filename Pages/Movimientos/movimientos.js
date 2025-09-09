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
let idsCargados = new Set();
let allMovimientosPorDia = {}; // { fecha: [todos los movimientos de ese día, en orden] }
let mostradosPorDia = {};      // { fecha: cuántos se han mostrado ya }
let fechasOrdenadas = [];      // Para mantener el orden de días
let totalMovsMostrados = 0;    // Controla el total de movimientos mostrados
let movimientoEditandoId = null;

window.cargarMovimientos = function() {
  if (cargando || noMasDatos) return;
  cargando = true;
  $('#movimientosList').append(loadingSpinner);
  $('#noMovimientosMsg').hide(); 

  // Solo cargamos una vez TODOS los movimientos (sin paginación backend)
  if (Object.keys(allMovimientosPorDia).length === 0) {
    // Montar query (sin offset ni limit)
    let query = 'fetchMovimientos.php';
    let params = [];
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
        return;
      }
      allMovimientosPorDia = resp.data || {};
      fechasOrdenadas = Object.keys(allMovimientosPorDia).sort((a, b) => b.localeCompare(a)); // Descendente
      mostradosPorDia = {};
      totalMovsMostrados = 0;
      // Si no hay movimientos
      if (fechasOrdenadas.length === 0) {
        $('#movimientosList').hide();
        $('#noMovimientosMsg').show();
        noMasDatos = true;
        return;
      }
      $('#noMovimientosMsg').hide();
      $('#movimientosList').show();
      // Primer scroll: mostrar los primeros 20
      window.cargarMasMovimientos();
    });
  } else {
    loadingSpinner.detach();
    cargando = false;
    window.cargarMasMovimientos();
  }
};

window.cargarMasMovimientos = function() {
  
  const limit = 20;
  let nuevosMostrados = 0;

  for (let i = 0; i < fechasOrdenadas.length; i++) {
    const fecha = fechasOrdenadas[i];
    const movimientos = allMovimientosPorDia[fecha];
    if (!mostradosPorDia[fecha]) mostradosPorDia[fecha] = 0;

    // Si es la primera vez, renderiza la tarjeta del día y el resumen
    let $diaExistente = $(`.movimientos-dia[data-fecha="${fecha}"]`);
    let $lista;
    if ($diaExistente.length > 0) {
      $lista = $diaExistente.find('.lista-mov-dia');
    } else {
      const dateObj = new Date(fecha);
      const fechaTexto = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const header = `
        <div class="mov-dia-header">
          <div class="movimientos-dia-fecha">${fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1)}</div>

          
          <div class="mov-dia-resumen">
            <span >Resumen diario: </span>
            <span class="mov-dia-cantidad"> </span>
          </div>
        </div>
        <div class="mov-row-header">
          <div class="mov-header-col">Cantidad</div>
          <div class="mov-header-col">Concepto</div>
          <div class="mov-header-col">Etiquetas</div>
          <div class="mov-header-col">Observaciones</div>
          <div class="mov-header-col">Cuenta/Efectivo</div>
          <div class="mov-header-col">Imagen</div>
          <div class="mov-header-col" style="flex:0 0 46px;"></div>
        </div>
        <div class="lista-mov-dia"></div>
      `;
      $diaExistente = $(`<div class="movimientos-dia" data-fecha="${fecha}">${header}</div>`);
      $lista = $diaExistente.find('.lista-mov-dia');
      $('#movimientosList').append($diaExistente);

      // Resumen diario (siempre con todos los movimientos)
      let totalDia = movimientos.reduce((acc, mov) => acc + parseFloat(mov.cantidad), 0);
      let resumenColor = totalDia > 0 ? 'positivo' : (totalDia < 0 ? 'negativo' : 'cero');
      let resumenTxt = (totalDia > 0 ? '+' : (totalDia < 0 ? '-' : '')) + Math.abs(totalDia).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) + " €";
      $diaExistente.find('.mov-dia-cantidad')
        .removeClass('positivo negativo cero')
        .addClass(resumenColor)
        .text(resumenTxt);

      // Sticky resumen (observer por cada día)
      const $resumen = $diaExistente.find('.mov-dia-resumen');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          $resumen.toggleClass('sticky', !entry.isIntersecting);
        });
      }, {threshold: [0, 1]});
      observer.observe($diaExistente[0]);
    }

    // Renderizar los movimientos que tocan para este día
    for (let j = mostradosPorDia[fecha]; j < movimientos.length; j++) {
      if (nuevosMostrados >= limit) break;
      const mov = movimientos[j];
      // (Evita repes si lo necesitas con data-id)
      if ($lista.find(`.movimiento-row[data-id="${mov.id}"]`).length === 0) {
        const cantidadClass = parseFloat(mov.cantidad) > 0 ? 'movimiento-cantidad ingreso' : 'movimiento-cantidad gasto';

        // Etiquetas
        let etiquetasHtml = '';
        if (mov.etiquetas && mov.etiquetas.length > 0) {
          etiquetasHtml = mov.etiquetas.map(e =>
            `<span class="chip-etiqueta">${e.nombre}</span>`
          ).join('');
        }

        // Observaciones
        const obsHtml = (mov.observaciones && mov.observaciones.trim().length > 0)
          ? `<div class="observaciones">${mov.observaciones}</div>` : '';

        // Imagen (miniatura, solo si hay imagen)
        let imgHtml = '';
        if (
          mov.imagen &&
          typeof mov.imagen === 'string' &&
          mov.imagen.trim() !== '' &&
          mov.imagen.toLowerCase() !== 'null'
        ) {
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

        let tipoHtml = '';
        if (mov.tipo_pago && String(mov.tipo_pago).trim() !== '') {
          tipoHtml = `<div class="tipo-pago">${mov.tipo_pago}</div>`;
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
            <div class="mov-col mov-col-tipo" data-value="${(mov.tipo_pago||'').trim()}">
              ${tipoHtml}
            </div>
            <div class="mov-col mov-col-img">
              ${imgHtml}
            </div>
            <div style="display: flex; justify-content: flex-end;" class="mov-col">
              <button class="mov-action-btn editar-mov-btn" data-id="${mov.id}" title="Editar movimiento">
                <i data-lucide="pencil"></i>
              </button>
              <button class="mov-action-btn eliminar-mov-btn" data-id="${mov.id}" title="Eliminar movimiento">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `);
        nuevosMostrados++;
        mostradosPorDia[fecha]++;
        totalMovsMostrados++;
      }
      if (nuevosMostrados >= limit) break;
    }
    if (nuevosMostrados >= limit) break;
  }

  lucide.createIcons();
  loadingSpinner.detach();
  cargando = false;

  // ¿Hay más por mostrar?
  if (totalMovsMostrados >= Object.values(allMovimientosPorDia).reduce((acc, arr) => acc + arr.length, 0)) {
    noMasDatos = true;
  }
};

if (movimientoEditandoId !== null) {
  // Oculta los botones de editar excepto el de la fila en edición
  $('.editar-mov-btn').each(function() {
    if ($(this).data('id') != movimientoEditandoId) {
      $(this).hide();
    }
  });
}


window.reiniciarYcargar = function(scrollToY = null) {

  $('#movimientosList').empty();  
  offset = 0;
  noMasDatos = false;
  allMovimientosPorDia = {};
  mostradosPorDia = {};
  fechasOrdenadas = [];
  totalMovsMostrados = 0;
  window.cargarMovimientos();

   if (scrollToY !== null) {
      window.scrollTo(scrollToY);
  }
};

$(function () {

   /* Funciones para editar*/

  $('#movimientosList').on('click', '.editar-mov-btn', function() {
    const movId = $(this).data('id');
    if (movimientoEditandoId !== null) return; // Ya hay uno en edición
    activarEdicionFila(movId);
  });

  function activarEdicionFila(movId) {
    // 1. Guardar los datos originales de la fila para poder restaurar
    const $row = $(`.movimiento-row[data-id="${movId}"]`);
    if ($row.length === 0) return;
    if (movimientoEditandoId !== null) return;

    // Guardamos el HTML original en data (puedes hacerlo también con JS si prefieres)
    $row.data('original-html', $row.html());
    
    movimientoEditandoId = movId;

    // 2. Obtener los datos actuales del movimiento (puedes obtenerlos de allMovimientosPorDia)
    // (Si tienes allMovimientosPorDia bien sincronizado, úsalo aquí. Ejemplo:)
    let movData = null;
    for (const fecha of Object.keys(allMovimientosPorDia)) {
      movData = allMovimientosPorDia[fecha].find(m => m.id == movId);
      if (movData) break;
    }
    if (!movData) return;

    // 3. Renderizar la fila como edición (inputs y dropdowns)
    $row.html(getEdicionRowHTML(movData));
    $row.addClass('editando-responsive');
    // 4. Inicializar controles y eventos
    inicializarControlesEdicion($row, movData);
    // 5. Ocultar todos los botones de editar menos el de esta fila (ya se hace automáticamente con el HTML nuevo)
    $('.editar-mov-btn').not(`[data-id="${movId}"]`).hide();
  }

  function getEdicionRowHTML(mov) {
    // Aquí debes copiar el HTML de los inputs, dropdowns y chips tal como en el modal, pero adaptado a fila de tabla
    // IMPORTANTE: cambia los ID de los elementos a clases o incluye el mov.id en el ID para evitar conflictos de varios modales
    // Ejemplo solo para la columna de cantidad (repite mismo patrón para las demás):

    // NOTA: Te hago solo el "esqueleto" y lo detallamos si te parece bien el sistema.
    return `
      <div class="edit-fecha-addon" 
          data-original-fecha="" 
          title="Editar fecha">
        <button type="button" class="btn-open-fecha" aria-label="Cambiar fecha">
          <i data-lucide="calendar"></i>
        </button>
        <input type="text" class="input-fecha-edit" autocomplete="off" />
        <input type="hidden" class="selected-fecha" value="" />
      </div>
      <div class="mov-col">
        <div class="input-container amount-with-currency edicion-cantidad" data-id="${mov.id}">
          <div class="sign-toggle">
            <button type="button" class="sign-btn plus-btn ${parseFloat(mov.cantidad) > 0 ? 'active' : ''}">
              <i data-lucide="plus"></i>
            </button>
            <button type="button" class="sign-btn minus-btn ${parseFloat(mov.cantidad) < 0 ? 'active' : ''}">
              <i data-lucide="minus"></i>
            </button>
          </div>
          <input type="number" class="input-cantidad" value="${mov.cantidad}">
          <label style="left: 30px;">Cantidad</label>
          <div class="currency-dropdown">
            <input type="hidden" class="selected-currency" value="${mov.moneda}">
            <div class="currency-display">${getMonedaSymbol(mov.moneda)}</div>
            <ul class="currency-options">
              <li data-value="EUR" data-symbol="€">EUR (€)</li>
              <li data-value="USD" data-symbol="$">USD ($)</li>
              <li data-value="GBP" data-symbol="£">GBP (£)</li>
              <li data-value="JPY" data-symbol="¥">JPY (¥)</li>
            </ul>
          </div>
          <p class="badCuantity bad-text"></p>
        </div>
      </div>
      <div class="mov-col">
        <!-- Concepto dropdown (mismo patrón) -->
        <div class="input-container concepto-dropdown edicion-concepto" data-id="${mov.id}">
          <div class="concepto-display">${mov.concepto}</div>
          <input type="hidden" class="selected-concepto" value="${mov.concepto}">
          <ul class="concepto-options"></ul>
          <p class="badConcept bad-text"></p>
        </div>
      </div>
      <div class="mov-col">
        <!-- Etiquetas chips y dropdown -->
        <div class="input-container edicion-etiquetas" data-id="${mov.id}">
          <div class="etiqueta-display">Etiquetas</div>
          <input type="hidden" class="input-etiquetas" value="${(mov.etiquetas||[]).map(e=>e.nombre).join(',')}">
          <ul class="etiqueta-options"></ul>
          <div class="chips-container"></div>
        </div>
      </div>
      <div class="mov-col">
        <!-- Observaciones -->
        <div class="input-container edicion-observaciones" data-id="${mov.id}">
          <textarea class="input-observaciones" rows="2">${mov.observaciones||''}</textarea>
          <label>Observaciones</label>
        </div>
      </div>

      <div class="mov-col">
        <!-- Tipo de pago (dropdown personalizado, igual patrón que moneda/concepto) -->
        <div class="input-container tipo-dropdown edicion-tipo" data-id="${mov.id}">
          <input type="hidden" class="selected-tipo" value="${mov.tipo_pago || ''}">
          <div class="tipo-display">${(mov.tipo_pago && mov.tipo_pago.trim()!=='') ? mov.tipo_pago : 'Tipo pago'}</div>
          <ul class="tipo-options">
            ${(!['cuenta','efectivo'].includes(String(mov.tipo_pago||'').toLowerCase())) ? `<li data-value="${mov.tipo_pago||''}">${mov.tipo_pago||''}</li>` : ''}
            <li data-value="cuenta">cuenta</li>
            <li data-value="efectivo">efectivo</li>
          </ul>
          <p class="badTipo bad-text" style="display:none;"></p>
        </div>
      </div>

      <div class="mov-col mov-col-img">
        ${mov.imagen && mov.imagen !== 'NULL' && mov.imagen !== '' ?
        `<div class="uploaded-preview" style="position:relative;">
          <img src="${mov.imagen}" alt="Imagen movimiento" class="img-editar">
          <span class="remove-image" title="Eliminar imagen" style="position:absolute;top:2px;right:2px;">×</span>
          <div class="spinner spinner-borrar-imagen" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:2;"></div>
        </div>`
        :
        `<label class="upload-label" style="cursor:pointer;">
          <input type="file" style="display:none;" class="input-imagen-editar" accept="image/*">
          Subir imagen
        </label>
        `}
        <div class="spinner spinner-editar" style="display:none;margin-top:5px;"></div>
      </div>
      <div class="mov-col" style="flex:0 0 92px;display:flex;gap:4px;justify-content:center;align-items:center;">
        <button class="tick-editar-btn" title="Guardar cambios">
          <i data-lucide="check"></i>
          <div class="spinner spinner-confirmar" style="display:none;margin-left:6px;"></div>
        </button>
        <button class="cancel-editar-btn" title="Cancelar edición"><i data-lucide="x"></i></button>
      </div>
    `;
  }

  $(document).on('mousedown.cerrarDropdownsEdicion', function (e) {
    // --- Concepto ---
    $('.concepto-dropdown').each(function() {
      const $display = $(this).find('.concepto-display');
      const $options = $(this).find('.concepto-options');
      if (
        !$display.is(e.target) &&
        $display.has(e.target).length === 0 &&
        !$options.is(e.target) &&
        $options.has(e.target).length === 0
      ) {
        $options.fadeOut(150);
        $display.removeClass('open');
        $(this).find('label').css('color', 'gray');
      }
    });

    // --- Moneda ---
    $('.currency-dropdown').each(function() {
      const $display = $(this).find('.currency-display');
      const $options = $(this).find('.currency-options');
      if (
        !$display.is(e.target) &&
        $display.has(e.target).length === 0 &&
        !$options.is(e.target) &&
        $options.has(e.target).length === 0
      ) {
        $options.fadeOut(150);
        $display.removeClass('open');
      }
    });
  });

  $(document).on('mousedown.edicionTipo', function(e) {
    const $row = $('.movimiento-row.editando-responsive');           // fila que está en edición
    if ($row.length === 0) {
      $(document).off('mousedown.edicionTipo');
      return;
    }
    const $cont = $row.find('.tipo-dropdown');
    const $display = $cont.find('.tipo-display');
    const $options = $cont.find('.tipo-options');
    if (!$cont.has(e.target).length) {
      $options.fadeOut(150);
      $display.removeClass('open');
      $(document).off('mousedown.edicionTipo');
    }
  });


  function getMonedaSymbol(moneda) {
    return moneda === 'EUR' ? '€'
        : moneda === 'USD' ? '$'
        : moneda === 'GBP' ? '£'
        : moneda === 'JPY' ? '¥'
        : moneda || '€';
  }

  function inicializarControlesEdicion($row, mov) {
    // === FECHA (Flatpickr) ===
    // Tomamos la fecha actual del movimiento desde el contenedor del día:
    const $diaContainer = $row.closest('.movimientos-dia'); 
    const fechaOriginal = ($diaContainer.data('fecha') || '').trim(); // formato YYYY-MM-DD confirmado por ti
    const $addonFecha   = $row.find('.edit-fecha-addon');
    const $inputFecha   = $row.find('.input-fecha-edit');
    const $selectedFecha= $row.find('.selected-fecha');

    // Guardamos la original en data- y en el hidden
    $addonFecha.attr('data-original-fecha', fechaOriginal);
    $selectedFecha.val(fechaOriginal);

    // Inicializamos flatpickr en modo single
    const fp = flatpickr($inputFecha[0], {
      dateFormat: "Y-m-d",
      locale: "es",
      defaultDate: fechaOriginal || null,
      clickOpens: false,           // el input está oculto; abrimos con el botón
      allowInput: false,
      appendTo: document.body,     // evita recortes por overflow del contenedor
      positionElement: $addonFecha[0], // posiciona respecto al “anexo” (icono)
      onChange: function(dates, str) {
        if (str) {
          $selectedFecha.val(str);
          fp.close();
        }
      }
    });

    // Abrimos con mousedown + stopPropagation para ganar a los “cerradores”
    $row.find('.btn-open-fecha')
      .off('mousedown')
      .on('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => { fp.open(); }, 0);
      });

    
    

    // 1. Botón +/– y cantidad (idéntico a tu modal pero adaptado a clases)
    const $cantidad = $row.find('.input-cantidad');
    const $plus     = $row.find('.plus-btn');
    const $minus    = $row.find('.minus-btn');
    $plus.on('click', function() {
      $plus.addClass('active'); $minus.removeClass('active');
      if ($cantidad.val()) $cantidad.val(Math.abs($cantidad.val()));
      // cargarConceptosTipo('ingreso'); // Si tienes conceptos por tipo
      // LIMPIA EL CONCEPTO SI HAY UNO DE GASTO SELECCIONADO
      $row.find('.selected-concepto').val('');
      $row.find('.concepto-display').text('Seleccionar concepto');
      cargarOpcionesConceptoEdicion($row, 'ingreso');
    });
    $minus.on('click', function() {
      $minus.addClass('active'); $plus.removeClass('active');
      if ($cantidad.val()) $cantidad.val('-'+Math.abs($cantidad.val()));
      // LIMPIA EL CONCEPTO SI HAY UNO DE GASTO SELECCIONADO
      $row.find('.selected-concepto').val('');
      $row.find('.concepto-display').text('Seleccionar concepto');
      cargarOpcionesConceptoEdicion($row, 'gasto');
    });

    // Al cambiar cantidad manualmente
    $cantidad.on('input', function() {
      let val = $(this).val();
      if (val.startsWith('-')) {
        $minus.addClass('active'); $plus.removeClass('active');
        cargarOpcionesConceptoEdicion($row, 'gasto');
      } else {
        $plus.addClass('active'); $minus.removeClass('active');
        cargarOpcionesConceptoEdicion($row, 'ingreso');
      }
    });

    // Moneda
    const $currencyDisplay = $row.find('.currency-display');
    const $currencyOptions = $row.find('.currency-options');
    $currencyDisplay.on('click', function() {
      $currencyOptions.fadeToggle(150);
      $(this).toggleClass('open');
    });
    $currencyOptions.on('click', 'li', function() {
      $currencyDisplay.text($(this).data('symbol')).removeClass('open');
      $row.find('.selected-currency').val($(this).data('value'));
      $currencyOptions.fadeOut(150);
    });

    const $tipoDisplay = $row.find('.tipo-display');
    const $tipoOptions = $row.find('.tipo-options');

    $tipoDisplay.on('click', function() {
      $tipoOptions.fadeToggle(150);
      $(this).toggleClass('open');
    });

    $tipoOptions.on('click', 'li', function() {
      const val = $(this).data('value');
      $row.find('.selected-tipo').val(val);
      $tipoDisplay.text(val).removeClass('open');
      $tipoOptions.fadeOut(150);
      $row.find('.badTipo').hide();
    });

    // Concepto dropdown (similar a modal)
    cargarOpcionesConceptoEdicion($row, $minus.hasClass('active') ? 'gasto' : 'ingreso');

    // Etiquetas (chips, igual que modal)
    inicializarEtiquetasEdicion($row, mov);

    // Observaciones: nada especial, solo placeholder y label flotante

    // Imagen: eliminar y subir nueva
    inicializarImagenEdicion($row, mov);

    // Tick y cruz
    $row.find('.tick-editar-btn').on('click', function() {
      confirmarEdicionFila($row, mov);
    });
    $row.find('.cancel-editar-btn').on('click', function() {
      cancelarEdicionFila($row, mov);
    });
    // Refrescar iconos lucide en lo que generes
    if (window.lucide) lucide.createIcons();
  }

  

  function cargarOpcionesConceptoEdicion($row, tipo) {
    // tipo: 'ingreso' o 'gasto'
    $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=' + tipo, function(data) {
      const $cOpts = $row.find('.concepto-options');
      $cOpts.empty();
      $cOpts.empty();
      if ($cOpts.find('.search-item').length === 0) {
        $cOpts.append(`
          <li class="search-item">
            <div class="input-container search-container">
              <input type="text" class="search-input" placeholder=" ">
              <label style="left: 33px;">Buscar...</label>
              <i data-lucide="search" class="search-icon"></i>
            </div>
          </li>
        `);
        if (window.lucide) lucide.createIcons();
      }

      $cOpts.find('li:not(.search-item)').remove(); // solo borra las que no son el input

      (data.conceptos || []).forEach(c => {
        $cOpts.append(`<li data-value="${c.nombre}">${c.nombre}</li>`);
      });
      $cOpts.append(`<li class="add-new" data-type="concepto">+ Añadir concepto</li>`);
      bindSearchInputEdicion($row, '.concepto-options');
      bindInlineAddEdicion($row, '.concepto-options', tipo);
    });

    // Dropdown desplegable
    $row.find('.concepto-display').off('click').on('click', function(e) {
      const $display = $(this);
      const $opts = $row.find('.concepto-options');
      $opts.fadeToggle(150);
      $display.toggleClass('open');
      $display.closest('.input-container').find('label').css('color',
        $display.hasClass('open') ? 'var(--azulPrimario)' : 'gray');
    });

    // Opción seleccionada
    $row.find('.concepto-options').off('click', 'li[data-value]').on('click', 'li[data-value]', function() {
      const val = $(this).data('value');
      $row.find('.concepto-display').text(val).removeClass('open');
      $row.find('.selected-concepto').val(val);
      $row.find('.concepto-options').fadeOut(150);
      $row.find('.input-container').removeClass('error');
      $row.find('.badConcept').hide();
      $row.find('.concepto-display').css({ border: "", color: "" });
    });

    // Cerrar al hacer click fuera (solo de este dropdown)
    $(document).on('mousedown.edicionConcepto', function(e) {
      if (!$row.find('.concepto-dropdown').has(e.target).length) {
        $row.find('.concepto-options').fadeOut(150);
        $row.find('.concepto-display').removeClass('open');
        $row.find('.concepto-dropdown label').css('color', 'gray');
        $(document).off('mousedown.edicionConcepto');
      }
    });
  }

  function bindSearchInputEdicion($row, selector) {
    $row.find(selector).off('input', '.search-input').on('input', '.search-input', function() {
      const q = this.value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $row.find(selector + ' li[data-value]').each(function() {
        const txt = $(this).text()
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        $(this).toggle(txt.includes(q));
      });
    });
  }

  function bindInlineAddEdicion($row, selector, tipo) {
    $row.find(selector)
      .off('click', 'li.add-new')
      .on('click', 'li.add-new', function() {
        const $li = $(this);
        $li.removeClass('add-new').addClass('adding');
        $li.empty().append(`
          <div class="input-container new-item-container">
            <input type="text" class="new-item-input" placeholder=" ">
            <label>+Añadir concepto</label>
          </div>
          <span class="spinner" style="display:none;">⏳</span>
          <div class="error-text" style="color: red !important;"></div>
        `);
        const $input = $li.find('input.new-item-input');
        const $spin = $li.find('span.spinner');
        const $error = $li.find('div.error-text');
        $input.focus();

        $input.on('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            const nombre = $input.val().trim();
            if (!nombre) {
              $error.text('El nombre no puede estar vacío.').show();
              return;
            }
            $input.prop('disabled', true); $error.hide(); $spin.show();
            $.post('../Componentes/Assets/userAvatar/addConcepto.php', { nombre, tipo: tipo === 'ingreso' ? 1 : 0 }, function(resp) {
              $spin.hide();
              if (resp.success) {
                $li.before(`<li data-value="${resp.nombre}">${resp.nombre}</li>`);
                $li.removeClass('adding').addClass('add-new').html(`+ Añadir concepto`);
              } else {
                $input.prop('disabled', false);
                $error.text(resp.error || 'Error al crear').show();
              }
            }, 'json').fail(() => {
              $spin.hide(); $input.prop('disabled', false);
              $error.text('Error de red').show();
            });
          } else if (e.key === 'Escape') {
            $li.removeClass('adding').addClass('add-new').html('+ Añadir concepto');
          }
        });

        // Click fuera = cancelar
        $(document).on('mousedown.inlineAddEdicion', function(ev) {
          if (!$li.is(ev.target) && $li.has(ev.target).length === 0) {
            $li.removeClass('adding').addClass('add-new').html('+ Añadir concepto');
            $(document).off('mousedown.inlineAddEdicion');
          }
        });
      });
  }

  function inicializarEtiquetasEdicion($row, mov) {
  // Chips y selección múltiple, igual que en el modal, pero aislado para esta fila
  let etiquetasSeleccionadas = (mov.etiquetas || []).map(e => e.nombre); // nombres de las etiquetas
  let etiquetasOriginales = []; // Todas disponibles para el usuario

  const $chipsContainer = $row.find('.chips-container');
  const $etiquetaOptions = $row.find('.etiqueta-options');
  const $etiquetaDisplay = $row.find('.etiqueta-display');
  const $inputEtiquetas = $row.find('.input-etiquetas');

  function renderChips() {
    $chipsContainer.empty();
    etiquetasSeleccionadas.forEach(etiqueta => {
      const chip = $(`
        <div class="chip" data-value="${etiqueta}">
          ${etiqueta}
          <button class="remove-chip" title="Eliminar etiqueta">×</button>
        </div>
      `);
      $chipsContainer.append(chip);
    });
    $inputEtiquetas.val(etiquetasSeleccionadas.join(','));
  }

  function updateDropdown() {
      $etiquetaOptions.empty();
      const $options = $row.find('.etiqueta-options');
      // Search bar
      $options.empty();
        if ($options.find('.search-item').length === 0) {
        $options.append(`
          <li class="search-item">
            <div class="input-container search-container">
              <input type="text" class="search-input" placeholder=" ">
              <label style="left: 33px;">Buscar...</label>
              <i data-lucide="search" class="search-icon"></i>
            </div>
          </li>
        `);
        if (window.lucide) lucide.createIcons();
      }

      $options.find('li:not(.search-item)').remove(); // solo borra las que no son el input

      lucide.createIcons();

      // Solo las disponibles (no seleccionadas)
      const disponibles = (etiquetasOriginales || []).filter(et => !etiquetasSeleccionadas.includes(et.nombre));
      disponibles.forEach(et => {
        $etiquetaOptions.append(`<li data-value="${et.nombre}">${et.nombre}</li>`);
      });
      $etiquetaOptions.append(`<li class="add-new" data-type="etiqueta">+ Añadir etiqueta</li>`);
    }

    // Cargar todas las etiquetas disponibles (solo una vez por edición)
    $.getJSON('../Componentes/Assets/fetchOptions.php', function(data) {
      etiquetasOriginales = data.etiquetas || [];
      renderChips();
      updateDropdown();
    });

    // Mostrar u ocultar el dropdown
    $etiquetaDisplay.off('click').on('click', function() {
      $etiquetaOptions.fadeToggle(150);
      $etiquetaDisplay.toggleClass('open');
    });

    // Selección de etiqueta
    $etiquetaOptions.off('click', 'li[data-value]')
      .on('click', 'li[data-value]', function() {
        const value = $(this).attr('data-value');
        if (etiquetasSeleccionadas.length >= 5) return;
        if (!etiquetasSeleccionadas.includes(value)) {
          etiquetasSeleccionadas.push(value);
          renderChips();
          updateDropdown();
          $etiquetaOptions.fadeOut(150);
          $etiquetaDisplay.removeClass('open');
        }
      });

    // Eliminar chip
    $chipsContainer.off('click', '.remove-chip').on('click', '.remove-chip', function(e) {
      e.stopPropagation();
      const value = $(this).closest('.chip').data('value');
      etiquetasSeleccionadas = etiquetasSeleccionadas.filter(et => String(et) !== String(value));
      renderChips();
      updateDropdown();
    });

    // Search
    $etiquetaOptions.off('input', '.search-input').on('input', '.search-input', function() {
      const q = this.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $etiquetaOptions.find('li[data-value]').each(function() {
        const txt = $(this).text().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        $(this).toggle(txt.includes(q));
      });
    });

    // Añadir nueva etiqueta inline
    $etiquetaOptions.off('click', 'li.add-new').on('click', 'li.add-new', function() {
      const $li = $(this);
      $li.removeClass('add-new').addClass('adding');
      $li.empty().append(`
        <div class="input-container new-item-container">
          <input type="text" class="new-item-input" placeholder=" ">
          <label>+Añadir etiqueta</label>
        </div>
        <span class="spinner" style="display:none;">⏳</span>
        <div class="error-text" style="color: red !important;"></div>
      `);
      const $input = $li.find('input.new-item-input');
      const $spin = $li.find('span.spinner');
      const $error = $li.find('div.error-text');
      $input.focus();
      $input.on('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const nombre = $input.val().trim();
          if (!nombre) { $error.text('El nombre no puede estar vacío.').show(); return; }
          $input.prop('disabled', true); $error.hide(); $spin.show();
          $.post('../Componentes/Assets/userAvatar/addEtiqueta.php', { nombre }, function(resp) {
            $spin.hide();
            if (resp.success) {
              etiquetasOriginales.push(resp);
              etiquetasSeleccionadas.push(resp.nombre);
              renderChips();
              updateDropdown();
            } else {
              $input.prop('disabled', false);
              $error.text(resp.error||'Error al crear').show();
            }
          }, 'json');
        } else if (e.key === 'Escape') {
          updateDropdown();
        }
      });
    });

    // Click fuera para cerrar
    $(document).on('mousedown.etiquetaEdicion', function(e) {
      if (!$etiquetaOptions.is(e.target) && $etiquetaOptions.has(e.target).length === 0 &&
          !$etiquetaDisplay.is(e.target) && $etiquetaDisplay.has(e.target).length === 0) {
        $etiquetaOptions.fadeOut(150);
        $etiquetaDisplay.removeClass('open');
      }
    });

    // Al salir de edición, quitar evento
    $row.on('destroyed', function() {
      $(document).off('mousedown.etiquetaEdicion');
    });

    // Inicializar chips y opciones
    renderChips();
    updateDropdown();
  }

  function inicializarImagenEdicion($row, mov) {
    // Eliminar imagen existente
    $row.find('.remove-image').off('click').on('click', function(e) {
      e.stopPropagation();
      // Mostrar minimodal de confirmación
      mostrarMiniModal('¿Quieres que se elimine la imagen?', function(confirmado) {
        if (confirmado) {
          const $spinner = $row.find('.spinner-borrar-imagen');
          $spinner.show();
          // AJAX a backend para borrar imagen (requiere endpoint propio)
          $.post('deleteImagenMovimiento.php', { id: mov.id }, function(resp) {
            if (resp.success) {
              // Quitar imagen del DOM y mostrar el label de subir imagen
              $row.find('.uploaded-preview').remove();
              $row.find('.mov-col-img').append(`
                <label class="upload-label" style="cursor:pointer;">
                  <input type="file" style="display:none;" class="input-imagen-editar" accept="image/*">
                  Subir imagen
                </label>
              `);
              $spinner.hide();
              inicializarImagenEdicion($row, mov); // Volver a enganchar el evento
            } else {
              $spinner.hide();
              alert('No se pudo borrar la imagen.');
            }
          }, 'json');
        }
      });
    });

    // Subida de nueva imagen
    $row.find('.input-imagen-editar').off('change').on('change', function(e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const $spinner = $row.find('.spinner-editar');
        $spinner.show();

        const reader = new FileReader();
        reader.onload = function(event) {
          $row.find('.upload-label').hide();
          $row.find('.mov-col-img').append(`
            <div class="uploaded-preview" style="position:relative;">
              <img src="${event.target.result}" alt="Imagen movimiento" class="img-editar">
              <span class="remove-image" title="Eliminar imagen" style="position:absolute;top:2px;right:2px;">×</span>
            </div>
          `);
          $spinner.hide();
          inicializarImagenEdicion($row, mov);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function mostrarMiniModal(texto, callback) {
    // Puedes usar tu mini modal existente, aquí va ejemplo ultra simple
    const $overlay = $('<div class="mini-modal-overlay"></div>').appendTo('body');
    const $modal = $(`
      <div class="mini-modal">
        <div class="mini-modal-content">
          <h4>${texto}</h4>
          <div style="text-align: right;">
            <button class="mini-modal-cancel">Cancelar</button>
            <button class="mini-modal-confirm">Confirmar</button>
          </div>
        </div>
      </div>
    `).appendTo('body');
    $overlay.show();
    $modal.show();

    $modal.find('.mini-modal-cancel').on('click', function() {
      $modal.remove(); $overlay.remove();
      callback(false);
    });
    $modal.find('.mini-modal-confirm').on('click', function() {
      $modal.remove(); $overlay.remove();
      callback(true);
    });
    $overlay.on('click', function() {
      $modal.remove(); $overlay.remove();
      callback(false);
    });
  }

  function confirmarEdicionFila($row, mov) {
    mostrarMiniModal('¿Seguro que quieres aplicar los cambios?', function(confirmado) {
      if (!confirmado) return;

      const $spinner = $row.find('.spinner-confirmar');
      $spinner.show();
      $row.find('.tick-editar-btn i').hide();

      

      // Recolectar valores de la edición
      const cantidadStr = ($row.find('.input-cantidad').val() || '').trim();
      const cantidad = cantidadStr === '' ? null : parseFloat(cantidadStr);
      const moneda = $row.find('.selected-currency').val() || 'EUR';
      const concepto = $row.find('.selected-concepto').val() || '';
      const observaciones = $row.find('.input-observaciones').val() || '';
      const tipoPago = ($row.find('.selected-tipo').val() || $row.find('.tipo-display').text() || '').trim();
      const etiquetasCsv = $row.find('.input-etiquetas').val() || '';
      // Fecha: sólo si cambia respecto a la original del día
      const fechaOriginalCached = ($row.closest('.movimientos-dia').data('fecha') || '').trim();
      const fechaNuevaCached    = ($row.find('.selected-fecha').val() || '').trim();

      const formData = new FormData();

      
      

      formData.append('id', String(mov.id));
      if (cantidad !== null && !Number.isNaN(cantidad)) formData.append('cantidad', cantidad);
      if (concepto) formData.append('concepto_id_nombre', concepto); // si usas id real, cambia a concepto_id
      formData.append('observaciones', observaciones);
      if (tipoPago) formData.append('tipo_pago', tipoPago);
      formData.append('moneda', moneda);
      if (etiquetasCsv) formData.append('etiquetas', etiquetasCsv);

      if (fechaNuevaCached && fechaNuevaCached !== fechaOriginalCached) {
        formData.append('fecha_elegida', fechaNuevaCached);
      }

      $.ajax({
        url: 'updateMovimiento.php', // ajusta ruta si la tienes en otro sitio
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json'
      }).done(function(resp) {
        if (!resp || resp.error) {
          alert(resp?.error || 'Error al actualizar');
          return;
        }

        // Actualizar DOM de la fila (sin recargar todo)
        const cantNum = (cantidad !== null && !Number.isNaN(cantidad)) ? cantidad : parseFloat(mov.cantidad);
        const esIngreso = cantNum > 0;
        const cantidadTxt = Math.abs(cantNum).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' ' + (moneda === 'EUR' ? '€' : moneda);

        $row.removeClass('editando-responsive');

        $row.html(`
          <div class="mov-col">
            <div class="movimiento-cantidad ${esIngreso ? 'ingreso' : 'gasto'}">${(cantNum).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})} ${moneda==='EUR'?'€':moneda}</div>
          </div>
          <div class="mov-col">
            <div class="movimiento-concepto">${concepto || mov.concepto}</div>
          </div>
          <div class="mov-col">
            ${(etiquetasCsv||'').split(',').filter(Boolean).map(e => `<span class="chip-etiqueta">${e}</span>`).join('')}
          </div>
          <div class="mov-col">
            ${observaciones ? `<div class="observaciones">${observaciones}</div>` : ''}
          </div>
          <div class="mov-col mov-col-tipo" data-value="${tipoPago || mov.tipo_pago || ''}">
            ${tipoPago || mov.tipo_pago || ''}
          </div>
          <div class="mov-col mov-col-img">
            ${$row.find('.uploaded-preview img').length ? $row.find('.uploaded-preview').prop('outerHTML') : ''}
          </div>
          <div class="mov-col mov-col-acciones">
            <button class="mov-action-btn editar-mov-btn" data-id="${mov.id}" title="Editar movimiento"><i data-lucide="pencil"></i></button>
            <button class="mov-action-btn eliminar-mov-btn" data-id="${mov.id}" title="Eliminar movimiento"><i data-lucide="trash-2"></i></button>
          </div>
        `);
        if (window.lucide) lucide.createIcons();

        // Actualiza cache en memoria (allMovimientosPorDia) para mantener coherencia
        for (const fecha of Object.keys(allMovimientosPorDia)) {
          const idx = allMovimientosPorDia[fecha].findIndex(m => m.id == mov.id);
          if (idx >= 0) {
            const mref = allMovimientosPorDia[fecha][idx];
            if (cantidad !== null && !Number.isNaN(cantidad)) mref.cantidad = cantidad;
            if (concepto) mref.concepto = concepto;
            mref.observaciones = observaciones;
            mref.moneda = moneda;
            if (tipoPago) mref.tipo_pago = tipoPago; // <-- NUEVO
            mref.etiquetas = (etiquetasCsv||'').split(',').filter(Boolean).map(n => ({nombre:n}));
            break;
          }
        }

        // === MOVER FILA ENTRE DÍAS (OPCIÓN B) ===
        (function() {
          const $diaContainer = $row.closest('.movimientos-dia');
          const fechaOriginal = fechaOriginalCached;  // ⬅️ usa la cacheada
          const fechaNueva    = fechaNuevaCached;     // ⬅️ usa la cacheada

          if (!fechaNueva || fechaNueva === fechaOriginal) return;

          // 1) Quitar del array del día original
          if (allMovimientosPorDia[fechaOriginal]) {
            const idxOld = allMovimientosPorDia[fechaOriginal].findIndex(m => m.id == mov.id);
            if (idxOld >= 0) {
              allMovimientosPorDia[fechaOriginal].splice(idxOld, 1);
            }
          }

          // 2) Si el contenedor del día original se queda vacío, eliminarlo
          const $diaOriginal = $diaContainer;
          if ($diaOriginal.find('.movimiento-row').length <= 1) {
            $diaOriginal.remove();
            delete allMovimientosPorDia[fechaOriginal];
            // ⬇️ mantener orden interno coherente
            const idxFecha = fechasOrdenadas.indexOf(fechaOriginal);
            if (idxFecha >= 0) fechasOrdenadas.splice(idxFecha, 1);
          } else {
            // Actualizar resumen del día original
            const totalOld = (allMovimientosPorDia[fechaOriginal] || []).reduce((acc, m) => acc + parseFloat(m.cantidad), 0);
            const colorOld = totalOld > 0 ? 'positivo' : (totalOld < 0 ? 'negativo' : 'cero');
            const txtOld   = (totalOld>0?'+':(totalOld<0?'-':'')) + Math.abs(totalOld).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' €';
            $diaOriginal.find('.mov-dia-cantidad').removeClass('positivo negativo cero').addClass(colorOld).text(txtOld);
          }

          // 3) Asegurar contenedor del día nuevo
          function ensureDiaContainer(fecha) {
            let $dia = $(`.movimientos-dia[data-fecha="${fecha}"]`);
            if ($dia.length) return $dia;

            const dateObj = new Date(fecha);
            const fechaTexto = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const header = `
              <div class="mov-dia-header">
                <div class="movimientos-dia-fecha">${(fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1))}</div>
                <div class="mov-dia-resumen">
                  <span>Resumen diario: </span>
                  <span class="mov-dia-cantidad cero">0,00 €</span>
                </div>
              </div>
              <div class="mov-row-header">
                <div class="mov-header-col">Cantidad</div>
                <div class="mov-header-col">Concepto</div>
                <div class="mov-header-col">Etiquetas</div>
                <div class="mov-header-col">Observaciones</div>
                <div class="mov-header-col">Cuenta/Efectivo</div>
                <div class="mov-header-col">Imagen</div>
                <div class="mov-header-col">Acciones</div>

              </div>
              <div class="lista-mov-dia"></div>
            `;
            $dia = $(`<div class="movimientos-dia" data-fecha="${fecha}">${header}</div>`);

            // === Insertar en orden DESC (YYYY-MM-DD) ===
            let insertado = false;
            $('#movimientosList .movimientos-dia').each(function () {
              const f = ($(this).data('fecha') || '').trim();
              // Si la nueva fecha es MÁS RECIENTE que f, va ANTES
              if (fecha.localeCompare(f) > 0) {
                $(this).before($dia);
                insertado = true;
                return false; // break
              }
            });
            if (!insertado) {
              $('#movimientosList').append($dia);
            }

            // Mantén sincronizado el array de fechas ordenadas (desc)
            if (!fechasOrdenadas.includes(fecha)) {
              fechasOrdenadas.push(fecha);
              fechasOrdenadas.sort((a, b) => b.localeCompare(a)); // más recientes arriba
            }

            // sticky resumen como ya hacías
            const $resumen = $dia.find('.mov-dia-resumen');
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                $resumen.toggleClass('sticky', !entry.isIntersecting);
              });
            }, {threshold: [0, 1]});
            observer.observe($dia[0]);

            return $dia;
          }

          const $diaNuevo = ensureDiaContainer(fechaNueva);

          // 4) Insertar la fila en el día nuevo (en modo “vista”)
          const cantNum = (cantidad !== null && !Number.isNaN(cantidad)) ? cantidad : parseFloat(mov.cantidad);
          const esIngreso = cantNum > 0;
          const cantidadTxt = (cantNum).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ' + (moneda==='EUR'?'€':moneda);
          const etiquetasHtmlFin = (etiquetasCsv||'').split(',').filter(Boolean).map(e => `<span class="chip-etiqueta">${e}</span>`).join('');
          const tipoFin = (tipoPago || mov.tipo_pago || '').trim();
          const tipoHtmlFin = tipoFin ? `<div class="tipo-pago">${tipoFin}</div>` : '';
          const imgHtmlFin = $row.find('.uploaded-preview img').length ? $row.find('.uploaded-preview').prop('outerHTML') : '';

          const $filaNueva = $(`
            <div class="movimiento-row" data-id="${mov.id}">
              <div class="mov-col">
                <div class="movimiento-cantidad ${esIngreso ? 'ingreso' : 'gasto'}">${cantidadTxt}</div>
              </div>
              <div class="mov-col"><div class="movimiento-concepto">${concepto || mov.concepto}</div></div>
              <div class="mov-col">${etiquetasHtmlFin}</div>
              <div class="mov-col">${observaciones ? `<div class="observaciones">${observaciones}</div>` : ''}</div>
              <div class="mov-col mov-col-tipo" data-value="${tipoFin}">${tipoHtmlFin}</div>
              <div class="mov-col mov-col-img">${imgHtmlFin}</div>
              <div class="mov-col mov-col-acciones">
                <button class="mov-action-btn editar-mov-btn" data-id="${mov.id}" title="Editar movimiento"><i data-lucide="pencil"></i></button>
                <button class="mov-action-btn eliminar-mov-btn" data-id="${mov.id}" title="Eliminar movimiento"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          `);

          $diaNuevo.find('.lista-mov-dia').prepend($filaNueva);
          $row.remove();
          if (window.lucide) lucide.createIcons();

          // 5) Actualizar cache en memoria en el nuevo día
          if (!allMovimientosPorDia[fechaNueva]) allMovimientosPorDia[fechaNueva] = [];
          const movActualizado = { ...mov };
          if (cantidad !== null && !Number.isNaN(cantidad)) movActualizado.cantidad = cantidad;
          if (concepto) movActualizado.concepto = concepto;
          movActualizado.observaciones = observaciones;
          movActualizado.moneda = moneda;
          if (tipoPago) movActualizado.tipo_pago = tipoPago;
          movActualizado.etiquetas = (etiquetasCsv||'').split(',').filter(Boolean).map(n => ({nombre:n}));
          allMovimientosPorDia[fechaNueva].unshift(movActualizado);

          // 6) Recalcular resumen del día nuevo
          const totalNew = allMovimientosPorDia[fechaNueva].reduce((acc, m) => acc + parseFloat(m.cantidad), 0);
          const colorNew = totalNew > 0 ? 'positivo' : (totalNew < 0 ? 'negativo' : 'cero');
          const txtNew   = (totalNew>0?'+':(totalNew<0?'-':'')) + Math.abs(totalNew).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' €';
          $diaNuevo.find('.mov-dia-cantidad').removeClass('positivo negativo cero').addClass(colorNew).text(txtNew);
        })();

        // Si prefieres recalcular resúmenes y todo el día:
        //reiniciarYcargar(window.scrollY);

      }).fail(function() {
        alert('Error de red al actualizar');
      }).always(function() {
        $spinner.hide();
        $row.find('.tick-editar-btn i').show();
        movimientoEditandoId = null;
        $('.editar-mov-btn').show();
      });
    });
  }

  function cancelarEdicionFila($row, mov) {
    mostrarMiniModal('¿Seguro que quieres cancelar la edición?', function(confirmado) {
      if (!confirmado) return;
      // Restaurar HTML original
        $row.removeClass('editando-responsive');
      $row.html($row.data('original-html'));
      movimientoEditandoId = null;
      $('.editar-mov-btn').show(); // Volver a mostrar los botones de editar
      if (window.lucide) lucide.createIcons();
    });
  }

  $('#movimientosList').on('click', '.eliminar-mov-btn', function() {
    const movId = $(this).data('id');
    mostrarMiniModal('¿Seguro que quieres eliminar este movimiento?', function(confirmado) {
      if (!confirmado) return;
      eliminarMovimiento(movId);
    });
  });

  function eliminarMovimiento(movId) {
    $.ajax({
      url: 'deleteMovimiento.php',
      type: 'POST',
      data: { id: movId },
      dataType: 'json',
      success: function(resp) {
        if (resp.success) {
          showSuccessMessage('Movimiento eliminado correctamente');

          // 1. Eliminar la fila del DOM
          const $row = $(`.movimiento-row[data-id="${movId}"]`);
          const $diaContainer = $row.closest('.movimientos-dia');
          $row.remove();

          // 2. Actualizar datos en allMovimientosPorDia
          const fecha = $diaContainer.data('fecha');
          if (allMovimientosPorDia[fecha]) {
            allMovimientosPorDia[fecha] = allMovimientosPorDia[fecha].filter(m => m.id != movId);
          }

          // 3. Si no quedan movimientos ese día, eliminar el contenedor entero
          if ($diaContainer.find('.movimiento-row').length === 0) {
            $diaContainer.remove();
            delete allMovimientosPorDia[fecha];
          } else {
            // 4. Actualizar el resumen diario
            const totalDia = allMovimientosPorDia[fecha].reduce((acc, m) => acc + parseFloat(m.cantidad), 0);
            const resumenColor = totalDia > 0 ? 'positivo' : (totalDia < 0 ? 'negativo' : 'cero');
            const resumenTxt = (totalDia > 0 ? '+' : (totalDia < 0 ? '-' : '')) +
              Math.abs(totalDia).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

            $diaContainer.find('.mov-dia-cantidad')
              .removeClass('positivo negativo cero')
              .addClass(resumenColor)
              .text(resumenTxt);
          }

          // 5. Si ya no hay días en pantalla
          if ($('#movimientosList .movimientos-dia').length === 0) {
            $('#movimientosList').hide();
            $('#noMovimientosMsg').show();
          }
        } else {
          alert(resp.error || 'No se pudo eliminar');
        }
      },
      error: function(xhr, status, error) {
        alert('Error AJAX: ' + error);
      }
    });
  }











  let cargando = false;
  let noMasDatos = false;

  // Abre/cierra bloque de filtros
  $('#toggleFiltrosBtn').click(function () {
    $('#filtrosBlock').slideToggle(170);
  });

  // Flatpickr para fechas
  flatpickr("#filtroFecha", {
    mode: "range",
    dateFormat: "Y-m-d",
    locale: "es",
    onClose: function (dates, str) {
      if (dates.length === 2) {
        filtros.fecha_inicio = formatDateLocal(dates[0]);
        filtros.fecha_fin    = formatDateLocal(dates[1]);
        window.reiniciarYcargar();
      }
      updateFloatingLabelFecha();
    }
  });


  function crearDropdownConceptoBicolor(idDisplay, idOptions, idValue, ingresos, gastos) {
  const $display = $('#' + idDisplay);
  const $options = $('#' + idOptions);
  const $value   = $('#' + idValue);

  // Toggle del panel (cerrando el de etiquetas si está abierto)
  $display.off('click').on('click', function(e) {
    $('#filtroEtiquetaOptions').fadeOut(80);
    $('#filtroEtiquetaDisplay').removeClass('open');
    $options.fadeToggle(120);
    $display.toggleClass('open');
    e.stopPropagation();
  });

  // Render inicial de la estructura bicolor
  function renderBicolor(qIng = '', qGas = '') {
      // Limpio y pinto estructura en 2 columnas
      $options.empty().append(`
        <div class="concepto-bicolor">
          <div class="concepto-todos" data-id="">Todos</div>

          <div class="concepto-col concepto-col--ingreso">
            <div class="concepto-col-title">Ingresos</div>
            <div class="input-container search-container">
              <input type="text" class="search-input ingreso" placeholder=" ">
              <label style="left: 33px;">Buscar.</label>
              <i data-lucide="search" class="search-icon"></i>
            </div>
            <ul class="concepto-col-list ingreso-list"></ul>
          </div>

          <div class="concepto-col concepto-col--gasto">
            <div class="concepto-col-title">Gastos</div>
            <div class="input-container search-container">
              <input type="text" class="search-input gasto" placeholder=" ">
              <label style="left: 33px;">Buscar.</label>
              <i data-lucide="search" class="search-icon"></i>
            </div>
            <ul class="concepto-col-list gasto-list"></ul>
          </div>
        </div>
      `);
      if (window.lucide) lucide.createIcons();

      // helper para pintar una lista
      function pintarLista($ul, arr, q, tipo) {
        $ul.empty();
        const txt = q.trim().toLowerCase();
        const data = txt ? arr.filter(c => c.nombre.toLowerCase().includes(txt)) : arr;
        data.forEach(item => {
          // data-id y data-tipo para saber si es ingreso/gasto al seleccionar
          $ul.append(`<li data-id="${item.id}" data-tipo="${tipo}">${item.nombre}</li>`);
        });
      }

      pintarLista($options.find('.ingreso-list'), ingresos, qIng, 'ingreso');
      pintarLista($options.find('.gasto-list'),   gastos,   qGas, 'gasto');
    }

    renderBicolor();

    // Buscadores independientes por columna
    $options.on('input', '.search-input.ingreso', function() {
      renderBicolor(this.value, $options.find('.search-input.gasto').val() || '');
      $options.find('.search-input.ingreso').val(this.value).focus();
    });
    $options.on('input', '.search-input.gasto', function() {
      renderBicolor($options.find('.search-input.ingreso').val() || '', this.value);
      $options.find('.search-input.gasto').val(this.value).focus();
    });

    // Opción "Todos"
    $options.on('click', '.concepto-todos', function() {
      $display.text('Todos').removeClass('is-ingreso is-gasto');
      $value.val('');
      $options.fadeOut(120);
      $display.removeClass('open');
      filtros.concepto_id = "";
      window.reiniciarYcargar();
    });

    // Selección de opción (en cualquiera de las dos listas)
    $options.on('click', 'li[data-id]', function() {
      const id    = $(this).data('id');
      const nombre= $(this).text();
      const tipo  = $(this).data('tipo'); // 'ingreso' | 'gasto'

      // Texto y color del display según tipo elegido
      $display.text(nombre)
              .removeClass('is-ingreso is-gasto')
              .addClass(tipo === 'ingreso' ? 'is-ingreso' : 'is-gasto');
      $value.val(id);

      $options.fadeOut(120);
      $display.removeClass('open');

      filtros.concepto_id = id || "";
      window.reiniciarYcargar();
    });

    // Click fuera → cerrar (como ya haces en el otro)
    $(document).off('click.dropdownConcepto').on('click.dropdownConcepto', function(e) {
      if (!$display.is(e.target) && $display.has(e.target).length === 0 &&
          !$options.is(e.target) && $options.has(e.target).length === 0) {
        $options.fadeOut(120);
        $display.removeClass('open');
      }
    });

    // Reset cuando se limpian filtros (reutiliza tu función global existente)
    // (Nada extra aquí: ya haces resetearDropdownFiltro() en el botón limpiar) :contentReference[oaicite:3]{index=3}
  }


  // Reemplaza la función entera por esta versión
  function cargarFiltrosDropdownsCustom() {
    // 1) Cargar conceptos separados
    const pIngresos = $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=ingreso');
    const pGastos   = $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=gasto');
    const pEtqs     = $.getJSON('../Componentes/Assets/fetchOptions.php');

    $.when(pIngresos, pGastos, pEtqs).done(function(respIng, respGas, respAll) {
      // jQuery.when devuelve [data, status, jqXHR]
      const conceptosIngreso = (respIng[0] && respIng[0].conceptos) ? respIng[0].conceptos : [];
      const conceptosGasto   = (respGas[0] && respGas[0].conceptos) ? respGas[0].conceptos : [];

      // Concepto → dropdown bicolor en 2 columnas
      crearDropdownConceptoBicolor(
        'filtroConceptoDisplay',
        'filtroConceptoOptions',
        'filtroConceptoValue',
        conceptosIngreso,
        conceptosGasto
      );

      // Etiquetas → igual que ahora
      const data = respAll[0] || {};
      const etiquetas = data.etiquetas || [];
      crearDropdownFiltro(
        'filtroEtiquetaDisplay',
        'filtroEtiquetaOptions',
        'filtroEtiquetaValue',
        etiquetas,
        'Todas'
      );
    });
  }

  cargarFiltrosDropdownsCustom();

  function crearDropdownFiltro(idDisplay, idOptions, idValue, dataList, placeholder) {
    const $display = $('#' + idDisplay);
    const $options = $('#' + idOptions);
    const $value   = $('#' + idValue);

    $display.off('click').on('click', function(e) {
      // Cerrar otros abiertos
      // Cerrar otros dropdowns manualmente
      if (idDisplay === 'filtroConceptoDisplay') {
        $('#filtroEtiquetaOptions').fadeOut(80);
        $('#filtroEtiquetaDisplay').removeClass('open');
      } else if (idDisplay === 'filtroEtiquetaDisplay') {
        $('#filtroConceptoOptions').fadeOut(80);
        $('#filtroConceptoDisplay').removeClass('open');
      }
      $options.fadeToggle(120);
      $display.toggleClass('open');
      e.stopPropagation();
    });

    // Construye la lista (incluye buscador arriba)
    function renderOptions(filtrar = '') {
      $options.empty();
        if ($options.find('.search-item').length === 0) {
        $options.append(`
          <li class="search-item">
            <div class="input-container search-container">
              <input type="text" class="search-input" placeholder=" ">
              <label style="left: 33px;">Buscar...</label>
              <i data-lucide="search" class="search-icon"></i>
            </div>
          </li>
        `);
        if (window.lucide) lucide.createIcons();
      }

      $options.find('li:not(.search-item)').remove(); // solo borra las que no son el input

      // Filtrar por texto
      let filtered = dataList;
      if (filtrar.trim() !== '') {
        const txt = filtrar.trim().toLowerCase();
        filtered = dataList.filter(c => c.nombre.toLowerCase().includes(txt));
      }

      // Primera opción: Todos/Todas (solo si no hay filtro aplicado)
      $options.append(`<li data-id="">${placeholder}</li>`);

      filtered.forEach(function (item) {
        $options.append(`<li data-id="${item.id}">${item.nombre}</li>`);
      });
    }

    renderOptions();

    // Buscar en tiempo real
    $options.on('input', '.search-input', function () {
      renderOptions(this.value);
      $options.find('.search-input').val(this.value).focus();
    });

    // Seleccionar opción
    $options.on('click', 'li[data-id]', function () {
      const id = $(this).data('id');
      const nombre = $(this).text();
      $display.text(nombre);
      $value.val(id);
      $options.fadeOut(120);
      $display.removeClass('open');

      // Cambia el filtro y recarga movimientos
      if (idDisplay === 'filtroConceptoDisplay') {
        filtros.concepto_id = id || "";
      } else {
        filtros.etiqueta_id = id || "";
      }
      window.reiniciarYcargar();
    });

    // Click fuera cierra
    $(document).on('click.filtroDropdown', function (e) {
      if (!$display.is(e.target) && $display.has(e.target).length === 0 &&
          !$options.is(e.target) && $options.has(e.target).length === 0) {
        $options.fadeOut(120);
        $display.removeClass('open');
      }
    });

    // Reset al limpiar filtros
    window.resetearDropdownFiltro = function() {
      $('#filtroConceptoDisplay').text('Todos').removeClass('is-ingreso is-gasto'); ;
      $('#filtroConceptoValue').val('');
      $('#filtroEtiquetaDisplay').text('Todas');
      $('#filtroEtiquetaValue').val('');
    };
  }

  // Aplica efecto de label flotante según valor
  function updateFloatingLabelFecha() {
    var $group = $('#filtroFecha').closest('.floating-label-group');
    if ($('#filtroFecha').val().trim() !== "") {
      $group.addClass('filled');
    } else {
      $group.removeClass('filled');
    }
  }

  // Al iniciar y al cambiar
  $('#filtroFecha').on('input change', updateFloatingLabelFecha);
  setTimeout(updateFloatingLabelFecha, 10);

  // Flatpickr: actualiza tras elegir
 

  const filtroFechaFlatpickr = $("#filtroFecha")[0]._flatpickr;

  // Al hacer click fuera del input y del calendario: cerrar flatpickr
  $(document).on("mousedown", function(e) {
    const $calendar = $(".flatpickr-calendar");
    const isInput = $(e.target).is("#filtroFecha");
    const isCalendar = $calendar.has(e.target).length > 0;
    if (!isInput && !isCalendar) {
      if (filtroFechaFlatpickr.isOpen) {
        filtroFechaFlatpickr.close();
      }
    }
  });

  // Cuando limpias filtros también debes resetear el label:
  $('#limpiarFiltrosBtn').click(function () {
    setTimeout(updateFloatingLabelFecha, 30);
  });




  // Handlers filtros
  $('#filtroConcepto').change(function () {
    filtros.concepto_id = $(this).val();
    window.reiniciarYcargar();
  });
  $('#filtroEtiqueta').change(function () {

    filtros.etiqueta_id = $(this).val();
    window.reiniciarYcargar();
  });
  $('#limpiarFiltrosBtn').click(function () {
    filtros = { concepto_id: "", etiqueta_id: "", fecha_inicio: "", fecha_fin: "" };
    window.resetearDropdownFiltro(); // ← para los dropdown custom
    $('#filtroFecha').val("");
    $("#filtroFecha")[0]._flatpickr.clear();
    window.reiniciarYcargar();
  });

  // Añadir movimiento (usa tu mismo JS que en principal, aquí solo lanzamos el modal)
  $('#addMovimientoBtn').click(function () {
    // Si tu modal se abre con showMovimientoModal(), llama aquí a esa función
    if (window.showMovimientoModal) showMovimientoModal();
    // O simplemente: $('#modalMovimiento').fadeIn(); según tu implementación
  });

  // Variables para scroll infinito
  let loadingSpinner = $('<div style="text-align:center;padding:30px;"><span>Cargando...</span></div>');

  

  // Cargar primeros movimientos
  window.reiniciarYcargar();

  // Scroll infinito
  $(window).on('scroll', function () {
    if (noMasDatos || cargando) return;
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 300) {
      window.cargarMovimientos();
    }
  });

  // Borrar movimiento — modal + AJAX
  let movimientoAEliminar = null;
  $('#movimientosList').on('click', '.eliminar-mov-btn', function () {
    movimientoAEliminar = $(this).data('id');
    $('#miniModalDeleteOverlay, #miniModalDelete').fadeIn(120);
    $('#miniModalDeleteError').hide();
  });
  $('#cancelDeleteMovimientoBtn, #miniModalDeleteOverlay').click(function () {
    $('#miniModalDeleteOverlay, #miniModalDelete').fadeOut(120);
    movimientoAEliminar = null;
  });
  $('#confirmDeleteMovimientoBtn').click(function () {
    if (!movimientoAEliminar) return;
    const $btn = $(`.eliminar-mov-btn[data-id="${movimientoAEliminar}"]`);
    $btn.find('i').hide();
    $btn.find('.spinner-eliminar').show();
    $btn.prop('disabled', true);
    $.post('../Principal/deleteMovimiento.php', { id: movimientoAEliminar }, function (resp) {
      if (resp.success) {
        $btn.find('i').show();
        $btn.find('.spinner-eliminar').hide();
        $btn.prop('disabled', false);
        showSuccessMessage('Movimiento eliminado');
        $('#miniModalDeleteOverlay, #miniModalDelete').fadeOut(120);
        window.reiniciarYcargar();
      } else {
        $btn.find('.spinner-eliminar').hide();
        $btn.prop('disabled', false);
        $('#miniModalDeleteError').text(resp.error || 'No se pudo eliminar').show();
      }
    }, 'json');
  });

  // Mostrar mensaje superior (igual que en principal)
  window.showSuccessMessage = function (text) {
    $('.success-alert').remove();
    const $alert = $('<div class="success-alert"></div>').text(text);
    $('body').append($alert);
    $alert.css("display", "block").slideDown(300).delay(2000).slideUp(300, function () { $(this).remove(); });
  };

  // Modal de imagen movimiento
  $('#movimientosList').on('click', '.mov-img-thumb', function () {
    const src = $(this).attr('data-img-full');
    $('#modalImagenMovImg').attr('src', src);
    $('#modalImagenMovDescargar').attr('href', src);
    $('#modalImagenMovimiento').fadeIn(120);
  });

  $('#modalImagenMovCerrar, #modalImagenMovimiento').on('click', function (e) {
    // Solo cerrar si se hace click fuera de la imagen o en el botón
    if (e.target.id === 'modalImagenMovCerrar' || e.target.id === 'modalImagenMovimiento') {
      $('#modalImagenMovimiento').fadeOut(120);
    }
  });

  // Evitar cerrar al hacer click sobre la imagen o acciones
  $('.modal-imagen-mov, #modalImagenMovImg, #modalImagenMovDescargar').on('click', function(e) {
    e.stopPropagation();
  });

  function formatDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /*Funciones para exportar / importar movimientos*/
   $('#descargarBtn').click(function () {
    $('#modalDescargar, #modalDescargarOverlay').fadeIn(140);
  });
  $('#importarBtn').click(function () {
    $('#modalImportar, #modalImportarOverlay').fadeIn(140);
  });
  // Cerrar modal descargar
  $('#cancelDescargarBtn, #modalDescargarOverlay').click(function () {
    $('#modalDescargar, #modalDescargarOverlay').fadeOut(140);
  });
  // Cerrar modal importar
  $('#cancelImportarBtn, #modalImportarOverlay').click(function () {
    $('#modalImportar, #modalImportarOverlay').fadeOut(140);
    resetImportarModal();
  });

  // --- DESCARGA DATOS ---
  $('#formDescargarDatos').submit(function (e) {
    e.preventDefault();
    let formato = $('input[name="formato"]:checked').val();
    // Descarga directa con redirect (POST forzando descarga)
    window.open('exportarMovimientos.php?formato=' + formato, '_blank');
    $('#modalDescargar, #modalDescargarOverlay').fadeOut(140);
  });

  // --- IMPORTAR DATOS ---
  // Drag & Drop
  $('#dropzoneImportar').on('click', function (e) {
    // Solo lanzar el input si NO es un arrastre
    if (!$(this).hasClass('dragover')) {
      $('#inputImportarArchivo').trigger('click');
    }
  });

  let archivoImportar = null;
  $('#inputImportarArchivo').on('change', function (e) {
    e.stopPropagation();
    if (e.target.files && e.target.files[0]) {
      archivoImportar = e.target.files[0];
      $('#nombreArchivoImportar').text(archivoImportar.name);
    }
  });
  // Drag events
  $('#dropzoneImportar').on('dragover', function (e) {
    e.preventDefault(); e.stopPropagation();
    $(this).addClass('dragover');
  }).on('dragleave dragend', function (e) {
    e.preventDefault(); e.stopPropagation();
    $(this).removeClass('dragover');
  }).on('drop', function (e) {
    e.preventDefault(); e.stopPropagation();
    $(this).removeClass('dragover');
    let files = e.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      archivoImportar = files[0];
      $('#nombreArchivoImportar').text(archivoImportar.name);
      $('#inputImportarArchivo')[0].files = files;
    }
    
  });

  // Drag & drop global para toda la página
  let dragCounter = 0;
  $(document).on('dragenter', function (e) {
    e.preventDefault();
    dragCounter++;
    $('#globalDropOverlay').addClass('visible');
  });
  $(document).on('dragleave', function (e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      $('#globalDropOverlay').removeClass('visible');
      dragCounter = 0;
    }
  });
  $(document).on('dragover', function (e) {
    e.preventDefault();
  });
  $(document).on('drop', function (e) {
    e.preventDefault();
    $('#globalDropOverlay').removeClass('visible');
    dragCounter = 0;
    let files = e.originalEvent.dataTransfer.files;
    if (files && files.length > 0) {
      $('#inputImportarArchivo')[0].files = files;
      $('#nombreArchivoImportar').text(files[0].name);
      // Si quieres que se abra el modal automáticamente (opcional)
      $('#modalImportar, #modalImportarOverlay').fadeIn(140);
    }
  });


  // Enviar importación AJAX
  $('#formImportarDatos').submit(function (e) {
    e.preventDefault();
    const $btn = $('#btnImportarArchivo');
    $btn.find('.importar-texto').hide();
    $btn.find('.spinner-importar').show();
    $btn.prop('disabled', true);
    if (!archivoImportar) {
      $btn.find('.importar-texto').show();
        $btn.find('.spinner-importar').hide();
        $btn.prop('disabled', false);
      showFailMessage('Selecciona un archivo primero.');
      return;
    }
    let formData = new FormData();
    formData.append('archivo', archivoImportar);

    $.ajax({
      url: 'importarMovimientos.php',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      dataType: 'json',
      success: function (resp) {
        if (resp.success) {
          $btn.find('.importar-texto').show();
          $btn.find('.spinner-importar').hide();
          $btn.prop('disabled', false);
          $('#modalImportar, #modalImportarOverlay').fadeOut(140);
          showSuccessMessage('¡Movimientos importados correctamente!');
          window.reiniciarYcargar && window.reiniciarYcargar();
           cargarFiltrosDropdownsCustom();
           
        } else {
          $btn.find('.importar-texto').show();
          $btn.find('.spinner-importar').hide();
          $btn.prop('disabled', false);
          showFailMessage(resp.error || 'Error al importar.');
        }
        resetImportarModal();
      },
      error: function () {
        $btn.find('.importar-texto').show();
        $btn.find('.spinner-importar').hide();
        $btn.prop('disabled', false);
        showFailMessage('Error en la subida del archivo.');
        resetImportarModal();
      }
    });
  });

  function resetImportarModal() {
    archivoImportar = null;
    $('#inputImportarArchivo').val('');
    $('#nombreArchivoImportar').text('');
  }

  // Mensajes
  window.showSuccessMessage = function (text) {
    $('.success-alert').remove();
    const $alert = $('<div class="success-alert"></div>').text(text);
    $('body').append($alert);
    $alert.css("display", "block").slideDown(300).delay(1800).slideUp(300, function () { $(this).remove(); });
  };
  window.showFailMessage = function (text) {
    $('.fail-alert').remove();
    const $alert = $('<div class="fail-alert"></div>').text(text);
    $('body').append($alert);
    $alert.css("display", "block").slideDown(300).delay(2300).slideUp(300, function () { $(this).remove(); });
  };


  
});

lucide.createIcons();