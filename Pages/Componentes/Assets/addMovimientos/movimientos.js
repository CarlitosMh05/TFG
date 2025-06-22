/* ================================ */
/* Funciones para dentro del modal  */
/* ================================ */

$(document).ready(function () 
{
  // Comrpobar si sale la opción de elegir entre efectivo y cuenta
  if (userEfectivo === null) 
  {
    // Ocultamos todo el div de tipoPago
    $('input[name="tipoPago"]').closest('.radio-container').css("opacity","0").css("cursor","auto");
  }
  else
  {
    $('input[name="tipoPago"]').closest('.radio-container').css("opacity","1").css("cursor","auto");

  }

  const addBtn = document.getElementById("addBtn");
  const overlay = document.getElementById("overlay");
  const modal = document.getElementById("modal");

  let conceptoIngresoPredeterminadoId = null;
  let conceptoGastoPredeterminadoId = null;

  /*Cargar las opciones y aparecer el modal al hacer click */
  addBtn.addEventListener("click", () => {

    // 1. Obtener predeterminados del usuario
    $.getJSON('../Componentes/Assets/userAvatar/getPredeterminados.php', resp => {
      if (resp.success) {
        const ingreso = resp.concepto_ingreso_id;
        const gasto = resp.concepto_gasto_id;
        const etiquetasPred = resp.etiquetas ? resp.etiquetas.map(et => et.nombre) : [];
        const tipo = resp.tipo_default;

        conceptoIngresoPredeterminadoId = ingreso;
        conceptoGastoPredeterminadoId = gasto;

        console.log(ingreso, gasto, etiquetasPred, tipo);
        let idConceptoPredet;
        if (tipo === 'ingreso') {
          $plus.addClass('active');
          $minus.removeClass('active');
          conceptoTipoActual = 'ingreso';
          idConceptoPredet = ingreso;
        } else {
          $minus.addClass('active');
          $plus.removeClass('active');
          conceptoTipoActual = 'gasto';
          idConceptoPredet = gasto;
        }

        // Ahora cargamos opciones y luego buscamos el nombre
        $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=' + conceptoTipoActual, data => {
          const conceptos = data.conceptos || [];
          const concepto = conceptos.find(c => c.id == idConceptoPredet);
          const nombre = concepto ? concepto.nombre : 'Seleccionar concepto';

          // Mostrar nombre y guardar nombre como valor
          $('#conceptoDisplay').text(nombre).removeClass('open');
          $('#selectedConcepto').val(nombre);

          // Guardar etiquetas
          etiquetasOriginales = data.etiquetas || [];
          etiquetasSeleccionadas = etiquetasPred;
          renderChips();
          updateDropdown();

          // Mostrar modal
          overlay.style.display = "block";
          modal.style.display = "block";
          document.body.classList.add("modal-open");

          // Resto de opciones (para inline-add y búsqueda)
          const $cOpts = $('#conceptoOptions');
          $cOpts.empty();
          $cOpts.append(`
            <li class="search-item">
              <div class="input-container search-container">
                <input type="text" class="search-input" placeholder=" ">
                <label style="left: 33px;">Buscar concepto…</label>
                <i data-lucide="search" class="search-icon"></i>
              </div>
            </li>
          `);
          conceptos.forEach(c => $cOpts.append(`<li data-value="${c.nombre}">${c.nombre}</li>`));
          $cOpts.append(`<li class="add-new" data-type="concepto">+ Añadir concepto</li>`);
          lucide.createIcons();
          bindInlineAdd();
          bindSearchInput();
        });
      }
    });

    loadOptions();
    overlay.style.display = "block";
    modal.style.display = "block";
    document.body.classList.add("modal-open");
  });

  // Solo cerrar si se hace clic fuera del modal
  overlay.addEventListener("click", (e) => {
    if (!modal.contains(e.target)) {
      overlay.style.display = "none";
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
    }
  });

  let conceptoTipoActual = 'gasto'; 

  //
  // Funciónes relacionadas con los signos
  //

  const $cantidad = $('#cantidad');
  const $plus     = $('#plusBtn');
  const $minus    = $('#minusBtn');
  function updateSign() {
    let val = $cantidad.val();
    if (val === '') return;   // nada que hacer si está vacío
    let num = parseFloat(val);
    if ($minus.hasClass('active')) {
      $cantidad.val(-Math.abs(num));
    } else {
      $cantidad.val(Math.abs(num));
    }
  }

  // Click en "+"
  $plus.on('click', () => {
    if (!$plus.hasClass('active')) {
      $plus.addClass('active');
      $minus.removeClass('active');
      conceptoTipoActual = 'ingreso'; // NUEVO
      if (conceptoIngresoPredeterminadoId) {
        $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=ingreso', data => {
          const concepto = (data.conceptos || []).find(c => c.id == conceptoIngresoPredeterminadoId);
          const nombre = concepto ? concepto.nombre : 'Seleccionar concepto';
          $('#conceptoDisplay').text(nombre);
          $('#selectedConcepto').val(nombre);
        });
      } else {
        $('#conceptoDisplay').text('Seleccionar concepto');
        $('#selectedConcepto').val('');
      }
      updateSign();
      loadOptions(); // recargar conceptos
    }
  });

  // Click en "–"
  $minus.on('click', () => {
    if (!$minus.hasClass('active')) {
      $minus.addClass('active');
      $plus.removeClass('active');
      conceptoTipoActual = 'gasto'; // NUEVO
      if (conceptoGastoPredeterminadoId) {
        $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=gasto', data => {
          const concepto = (data.conceptos || []).find(c => c.id == conceptoGastoPredeterminadoId);
          const nombre = concepto ? concepto.nombre : 'Seleccionar concepto';
          $('#conceptoDisplay').text(nombre);
          $('#selectedConcepto').val(nombre);
        });
      } else {
        $('#conceptoDisplay').text('Seleccionar concepto');
        $('#selectedConcepto').val('');
      }
      updateSign();
      loadOptions(); // recargar conceptos
    }
  });

  // Si el usuario edita el input manualmente, sincronizamos botones
  $cantidad.on('input', function() 
  {
    let v = $(this).val();
  
    // 1) Si el usuario teclea un '-' al principio, lo respetamos y marcamos el botón
    if (v.startsWith('-')) {
      $minus.addClass('active');
      $plus.removeClass('active');
      return;
    }
  
    // 2) Si el toggle está en negativo y hay contenido, añadimos el '-' delante
    if ($minus.hasClass('active') && v !== '') {
      $(this).val('-' + v);
      // cortocircuitamos para no volver a sincronizar abajo
      return;
    }
  
    // 3) Finalmente, si tras todo está empezando por '-', marcamos minus, si no, plus
    v = $(this).val();
    if (v.startsWith('-')) {
      $minus.addClass('active');
      $plus.removeClass('active');
    } else {
      $plus.addClass('active');
      $minus.removeClass('active');
    }
  });


  //Función para que aparezca o desaparezca la caja de la fecha
  $('input[name="momento"]').on('change', function () {
    const value = $(this).val();

    if (value === 'fecha') {
      $('#fechaContainer').slideDown(150);
      $('#recurrenteContainer').slideUp(150);
    } else if (value === 'recurrente') {
      $('#recurrenteContainer').slideDown(150);
      $('#fechaContainer').slideUp(150);
    } else {
      $('#fechaContainer').slideUp(150);
      $('#recurrenteContainer').slideUp(150);
    }

  });

   //
   // FUNCIONES RELACIONADAS CON LOS DROPDOWNS
   //


   // 
   // Menu de la moneda
   //

   //Desplegar opciones
   $('#currencyDisplay').on('click', function (e) {
    $('#currencyOptions').fadeToggle(150);
    $(this).toggleClass('open');
  });

  // Selección de moneda
  $('#currencyOptions li').on('click', function (e) {
    const symbol = $(this).data('symbol');
    const value = $(this).data('value');

    $('#currencyDisplay').text(symbol).removeClass('open');
    $('#selectedCurrency').val(value);
    $('#currencyOptions').fadeOut(150);
  });

   // 
   // Menu de la de la frecuencia
   //

   //Desplegar menu
   $('#frecuenciaDisplay').on('click', function (e) {
    $('#frecuenciaOptions').fadeToggle(150);
    $(this).toggleClass('open');
  });

  //Cerrar al clickar una opción
  $('#frecuenciaOptions li').on('click', function () {
    const value = $(this).data('value');
    $('#frecuenciaDisplay').text(value).toggleClass('open');;
    $('#frecuenciaOptions').fadeOut(150);
  
    if (value === 'Mensual') {
      // Reemplazar por input numérico
      $("#inputRecurrencia").html(`
        <input type="number" id="diaRecurrente" placeholder=" " required min="1" max="31">
        <label for="diaRecurrente">Día</label>
      `);
    } else {
      // Reemplazar por input de texto con flatpickr
      $("#inputRecurrencia").html(`
        <input type="text" id="diaRecurrente" placeholder=" " required>
        <label for="diaRecurrente">Mes y día</label>
      `);
      flatpickr("#diaRecurrente", {
        dateFormat: "d-m",
        altInput: true,
        altFormat: "j F",
        defaultDate: "today",
        locale: "es",
        onReady: function (selectedDates, dateStr, instance) {
          if (instance.currentYearElement) {
            instance.currentYearElement.style.display = "none";
          }
        },
        onOpen: function(selectedDates, dateStr, instance) {
          if (instance.currentYearElement) {
            instance.currentYearElement.style.display = "none";
          }
        },
        onMonthChange: function(selectedDates, dateStr, instance) {
          if (instance.currentYearElement) {
            instance.currentYearElement.style.display = "none";
          }
        }
        
        
      });
    }
  });
  

  // 
  // Menu de la del concepto
  //

  // Click en el display de Concepto
  $('#conceptoDisplay').on('click', function(e) {
    const $disp    = $(this);
    const $cont    = $disp.closest('.input-container');
    const $options = $('#conceptoOptions');

    // Mostrar u ocultar menú
    $options.fadeToggle(150);

    // Si hay error, no tocamos estilos
    if ($cont.hasClass('error')) {
      return;
    }

    // Si no hay error, alternamos clase .open para aplicar solo mientras esté desplegado
    $disp.toggleClass('open');

    // Ajustamos el color del label según el estado abierto/cerrado
    $cont.find('label').css('color',
      $disp.hasClass('open')
        ? 'var(--azulPrimario)'
        : 'gray'
    );
  });

  // Click en las opciones de concepto
  $('#conceptoOptions').off('click','li')
  .on('click', 'li[data-value]', function(e) {
    const value = $(this).data('value');
    const $disp = $('#conceptoDisplay');
    const $cont = $disp.closest('.input-container');

    // 1) Actualizar texto y cerrar menú
    $disp
      .text(value)
      .removeClass('open');
    $('#conceptoOptions').fadeOut(150);

    // 2) Guardar en el hidden
    $('#selectedConcepto').val(value);

    // 3) Limpiar cualquier estado de error
    $cont
      .removeClass('error')
      .find('.badConcept').hide();

    // 4) Restaurar el estilo por defecto (gris)
    //    Quitamos cualquier inline que pudiera quedar
    $disp.css({
      'border': '',   // vuelve a border:1px solid gray del CSS
      'color': ''     // vuelve a color: #333 del CSS
    });
    $cont.find('label').css('color', 'gray');
  });

 
  //Si se hace click fuera de un dropdown cerrarlo
  $(document).on('click', function (e) {
    // Solo cerrar si el clic no está dentro de ningún dropdown
    if (!$(e.target).closest('.etiqueta-dropdown, .concepto-dropdown, .frecuencia-dropdown, .currency-dropdown').length) {
        setTimeout(() => {
            $('#etiquetaOptions').fadeOut(150);
            $('#etiquetaDisplay').removeClass('open');
            $('#etiquetaDisplay').closest('.input-container').find('label').css('color', 'gray');

            $('#conceptoOptions').fadeOut(150);
            $('#conceptoDisplay').removeClass('open');
            $('#conceptoDisplay').closest('.input-container').find('label').css('color', 'gray');

            $('#frecuenciaOptions').fadeOut(150);
            $('#frecuenciaDisplay').removeClass('open');

            $('#currencyOptions').fadeOut(150);
            $('#currencyDisplay').removeClass('open');
        }, 10);
    }
  });

  
  //Codigo para cambiar el estilo del calendario de la fecha y que se vea igual que el del mes y dia
  flatpickr("#fechaElegida", {
    dateFormat: "d-m-Y",
    altInput: true,
    altFormat: "j F Y",
    defaultDate: "today",
    locale: "es"
  });


  //
  // Funciones para el tema de la imagen
  //

  function mostrarImagen(file) {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onload = function (event) {
        $('#previewImg').attr('src', event.target.result);
        $('#fileName').text(file.name).attr('title', file.name);
        $('#fileNameTooltip').text(file.name);
        $('#uploadedPreview').show();
        $('.upload-label').hide();

        // Mostrar tooltip solo si el texto está truncado
        setTimeout(() => {
          const fileNameEl = document.getElementById('fileName');
          const wrapper = document.querySelector('.file-name-wrapper');
        
          // Quitar clase primero
          wrapper.classList.remove('show-tooltip');
        
          // Añadir clase solo si hay truncamiento
          if (fileNameEl.scrollWidth > fileNameEl.clientWidth) {
            wrapper.classList.add('show-tooltip');
          }
        }, 100);
      };

      reader.readAsDataURL(file);
    }
  }

  // Subida de imagen inicial
  $('#imagenCompra').on('change', function (e) {
    const file = e.target.files[0];
    mostrarImagen(file);
  });

  // Permitir volver a subir otra imagen haciendo clic en miniatura o nombre
  $('#uploadedPreview').on('click', function (e) {
    // Evitar conflicto con botón de eliminar
    if (!$(e.target).is('#removeImage')) {
      $('#imagenCompra').click();
    }
  });

  // Eliminar imagen subida
  $('#removeImage').on('click', function () {
    $('#imagenCompra').val('');
    $('#uploadedPreview').hide();
    $('.upload-label').show();
  });


  //
  //  FUNCIONAMIENTO DE LAS ETIQUETAS
  //

  let etiquetasOriginales;

  const chipsContainer = $('#chipsContainer');
  const etiquetaOptions = $('#etiquetaOptions');
  const etiquetaDisplay = $('#etiquetaDisplay');
  const etiquetaInput = $('#etiqueta'); // input hidden
  const etiquetaContainer = $('#etiquetaDisplay').closest('.input-container');

  let etiquetasSeleccionadas = [];

  //Cargar las etiquetas 
  function renderChips() {
    chipsContainer.empty();

    etiquetasSeleccionadas.forEach(etiqueta => {
      const chip = $(`
        <div class="chip" data-value="${etiqueta}">
          ${etiqueta}
          <button class="remove-chip" title="Eliminar etiqueta">×</button>
        </div>
      `);
      chipsContainer.append(chip);
    });

    $('#etiqueta').val(etiquetasSeleccionadas.join(','));

    updateCompactHeight();

    if (etiquetasSeleccionadas.length < 5) {
      etiquetaOptions.find('li.add-new').show();
      etiquetaOptions.find('.search-input').prop('disabled', false);
    }
  }

  //Actualizar el dropdown de las etiquetas en funcion de las que ya hay elegidas
  function updateDropdown() {
    etiquetaOptions.empty();

    // 1) Search bar
    etiquetaOptions.append(`
      <li class="search-item">
        <div class="input-container search-container">
          <input type="text" class="search-input" placeholder=" ">
          <label style="left: 33px; color: black !important;">Buscar etiqueta…</label>
          <i data-lucide="search" class="search-icon"></i>
        </div>
      </li>
    `);
      lucide.createIcons();

    const disponibles = (etiquetasOriginales || []).filter(et => !etiquetasSeleccionadas.includes(et));

    disponibles.forEach(et => {
      etiquetaOptions.append(`<li data-value="${et.nombre}">${et.nombre}</li>`);
    });

    etiquetaOptions.append(`<li class="add-new" data-type="etiqueta">+ Añadir etiqueta</li>`);
  }

  //Actualizar la altura en funcion de las etiquetas que hay seleccionadas
  function updateCompactHeight() {
    const isSingleLine = chipsContainer.height() <= 30;
    if (isSingleLine && etiquetasSeleccionadas.length > 0) {
      etiquetaContainer.addClass('compact');
    } else {
      etiquetaContainer.removeClass('compact');
    }
  }

  // Desplegar menú
  etiquetaDisplay.on('click', function () {
    const isOpen = $(this).hasClass('open');
    etiquetaOptions.fadeToggle(150);
    etiquetaDisplay.toggleClass('open');

    // Cambiar color del label según el estado del dropdown
    const label = $(this).closest('.input-container').find('label');
    if (isOpen) {
        label.css('color', 'gray'); // Dropdown cerrado
    } else {
        label.css('color', 'var(--azulPrimario)'); // Dropdown abierto
    }
  });

  // Seleccionar una etiqueta
  etiquetaOptions.off('click','li')
  .on('click', 'li[data-value]', function(e) {
    const value = $(this).attr('data-value');

    // 1) Si ya hay 5 etiquetas, mostramos un aviso y salimos
    if (etiquetasSeleccionadas.length >= 5) {
      // puedes usar alert(), o mejor, un mensaje más suave en la UI:
      if (etiquetaContainer.find('.error-limit').length === 0) {
      const $msg = $('<div class="error-limit" style="color: red; margin: 5px 0;" >Máximo 5 etiquetas</div>');
      etiquetaContainer.append($msg);
      setTimeout(() => $msg.fadeOut(300, () => $msg.remove()), 2000);
      }
      return;

    }

    if (!etiquetasSeleccionadas.includes(value)) {
      etiquetasSeleccionadas.push(value);
      renderChips();
      updateDropdown();

      etiquetaOptions.fadeOut(150);
      etiquetaDisplay.removeClass('open');
    }


    $('#etiquetaDisplay').closest('.input-container').find('label').css('color', 'gray');
  });

  // Eliminar chip
  chipsContainer.on('click', '.chip', function () {
    const value = $(this).attr('data-value');
    etiquetasSeleccionadas = etiquetasSeleccionadas.filter(et => et !== value);
    renderChips();
    updateDropdown();
  });

  // Cerrar menú al hacer clic fuera
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.etiqueta-dropdown').length) {
      etiquetaOptions.fadeOut(150);
      etiquetaDisplay.removeClass('open');
      $('#etiquetaDisplay').closest('.input-container').find('label').css('color', 'gray');
    }
  });

  // Inicializar
  renderChips();
  updateDropdown();


  // Cargar los conceptos y las etiquetas de la base de datos
  function loadOptions() {
    
    // 1) Conceptos
    $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=' + conceptoTipoActual, data => {
      const $cOpts = $('#conceptoOptions');
      $cOpts.empty();

      $cOpts.append(`
        <li class="search-item">
          <div class="input-container search-container">
            <input type="text" class="search-input" placeholder=" ">
            <label style="left: 33px;">Buscar concepto…</label>
            <i data-lucide="search" class="search-icon"></i>
          </div>
        </li>
      `);
      lucide.createIcons();

      

      data.conceptos.forEach(c => $cOpts.append(`<li data-value="${c.nombre}">${c.nombre}</li>`));
      $cOpts.append(`<li class="add-new" data-type="concepto">+ Añadir concepto</li>`);

      etiquetasOriginales = data.etiquetas;
      renderChips();
      updateDropdown();

      bindInlineAdd();
      bindSearchInput();
    });
    
  }
  
  //Funcion para añadir una nueva etiqueta o concepto 
  function bindInlineAdd() {
    // Delegamos sobre ambos dropdowns
    $('#conceptoOptions, #etiquetaOptions')
      .off('click', 'li.add-new')
      .on('click', 'li.add-new', function() {
        const $li   = $(this);
        const tipo  = $li.data('type');                           // 'concepto' o 'etiqueta'
        const url   = tipo==='concepto'? '../Componentes/Assets/userAvatar/addConcepto.php':'../Componentes/Assets/userAvatar/addEtiqueta.php';
        const place = tipo==='concepto'? 'concepto':'etiqueta';
  
        // transformamos el LI en campo de texto + spinner + mensaje error
        $li
          .removeClass('add-new')
          .addClass('adding')
          .html(`
            <div class="input-container new-item-container">
              <input type="text" class="new-item-input" placeholder=" ">
              <label>+Añadir ${place}</label>
            </div>
            <span class="spinner" style="display:none;">⏳</span>
            <div class="error-text" style="color: red !important;"></div>
          `);
  
        const $input   = $li.find('input.new-item-input');
        const $spin    = $li.find('span.spinner');
        const $error   = $li.find('div.error-text');
        $input.focus();
  
        // 1) Pulsar Enter => AJAX
        $input.on('keydown', e => {
          if (e.key==='Enter') {
            e.preventDefault();
            const nombre = $input.val().trim();
            if (!nombre) {
              $error.text('El nombre no puede estar vacío.').show();
              $error[0].scrollIntoView({
                behavior: 'smooth',
                block:    'nearest'
              });
              return;
            }
            // petición
            $input.prop('disabled', true);
            $error.hide();
            $spin.show();
  
            $.post(url, { 
                nombre, 
                tipo: conceptoTipoActual === 'ingreso' ? 1 : 0 
              }, resp => 
            {
              $spin.hide();
              if (resp.success) {
                if (tipo === 'concepto') {
                  // 1) Creamos el nuevo <li>
                  const $newLi = $(`<li data-value="${resp.nombre}">${resp.nombre}</li>`);
                  // 2) Lo insertamos justo antes del "add-new" actual
                  $li.before($newLi);
                  // 3) Reiniciamos el <li> de inline-add para volver a "+ Añadir concepto"
                  $li
                    .removeClass('adding')
                    .addClass('add-new')
                    .html(`+ Añadir concepto`);
                  // ¡El dropdown queda abierto y ya tienes el nuevo concepto listo para seleccionar!
                }
                else
                {
                  // 1) Añadimos el nuevo al listado justo encima
                  etiquetasOriginales.push(resp);
                  // 2) limpiamos input para siguiente
                  $input.prop('disabled', false).val('').focus();

                  updateDropdown();
                }
              } 
              else 
              {
                $input.prop('disabled', false);
                $error.text(resp.error||'Error al crear').show();
              }
            }, 'json')
            .fail(()=>{
              
              $spin.hide();
              $input.prop('disabled', false);
              $error.text('Error de red').show();
              $error[0].scrollIntoView({
                behavior: 'smooth',
                block:    'nearest'
              });
            });
          }
          // 2) Pulsar Esc => cancelar
          else if (e.key==='Escape') {
            cancelInline($li, place);
          }
        });
  
        // 3) Click fuera => cancelar
        $(document).on('mousedown.inlineAdd', ev => {
          if (!$li.is(ev.target) && $li.has(ev.target).length===0) {
            cancelInline($li, place);
            $(document).off('mousedown.inlineAdd');
          }
        });
    });
  }

  //Funcino para buscar conceptos o etiquetas
  function bindSearchInput() {
    $('#conceptoOptions, #etiquetaOptions').off('input', '.search-input');
  
    // filtrado en concepto
    $('#conceptoOptions').on('input', '.search-input', function() {
      const q = this.value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $('#conceptoOptions li[data-value]').each(function() {
        const txt = $(this).text()
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        $(this).toggle(txt.includes(q));
      });
    });
  
    // filtrado en etiqueta
    $('#etiquetaOptions').on('input', '.search-input', function() {
      const q = this.value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $('#etiquetaOptions li[data-value]').each(function() {
        const txt = $(this).text()
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        $(this).toggle(txt.includes(q));
      });
    });
  }
  
  // Funcion por si hay un error al añadir la etiqueta
  function cancelInline($li, place) {
    $li.off()
       .removeClass('adding')
       .addClass('add-new')
       .html(`+ Añadir ${place}`);
  }
  

  //
  // FUNCIONES RELACIONADAS CON EL TOOLTIP
  //

  let tooltipTimeout;
  let insideTooltip = false;

  const tooltip = $('#infoTooltip');
  const icon = $('#infoIcon');
  



  $(document).on('mouseenter', '#infoIcon', function() {
    clearTimeout(tooltipTimeout);
    const $icon = $(this);
    const offset = $icon.offset();
    const iconWidth = $icon.outerWidth();
    tooltip
      .css({ top: offset.top - 10, left: offset.left + iconWidth + 8 })
      .fadeIn(150);
  });
  
  $(document).on('mouseleave', '#infoIcon', function() {
    tooltip.fadeOut(150);
  });
  
  //Procesar datos subidos

  $("#confirmBtn").click(function(event) {
    event.preventDefault(); 

    const $btn = $(this);

    // Si ya está deshabilitado, salir (evita doble envío)
    if ($btn.prop('disabled')) return;
  
    // Otros reads…
    const cantidad       = $('#cantidad').val().trim();
    const moneda         = $('#selectedCurrency').val();
    const observaciones  = $('#observaciones').val().trim();
    const concepto       = $('#selectedConcepto').val();
    const etiquetasArr   = $('#etiqueta').val().split(',').filter(et => et.trim() !== '');
    const tipoPago       = $('input[name="tipoPago"]:checked').val();
    const momento        = $('input[name="momento"]:checked').val();
  
    // Si usas “fecha” o “recurrente”, seguramente querrás capturar también:
    let fechaElegida, diaRecurrente, frecuencia;
    if (momento === 'fecha') {
      fechaElegida = $('#fechaElegida').val();
    } else if (momento === 'recurrente') {
      diaRecurrente = $('#diaRecurrente').val();
      frecuencia    = $('#frecuenciaDisplay').text();
    }
    else {
      const now = new Date();
      fechaElegida = `${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}`;
    }

    
  
    // Remover cualquier error previo
    $('.input-container').removeClass('error');
    $('.bad-text').hide();
    $('.input-container input').css("border", "1px solid gray");
  
    let hasError = false;
  
    // Validar cantidad
    if (!cantidad) {
      $('.badCuantity').show();
      $('#cantidad').closest('.input-container').addClass('error');
      $('#cantidad').css("border", "1px solid red");
      hasError = true;
    }
  
    // Validar concepto
    if (!concepto) {
      $('.badConcept').show();
      const $cDisp = $('#conceptoDisplay').closest('.input-container').addClass('error');
      $('#conceptoDisplay').css({ border: "1px solid red", color: "red" });
      hasError = true;
    }
  
    if (hasError) {
      $btn.prop('disabled', false);
      return;
    }
    
    // —— Construir FormData usando las variables ——  
    const formData = new FormData();

    formData.append('cantidad',      cantidad);
    formData.append('moneda',        moneda);
    formData.append('concepto',      concepto);
    formData.append('observaciones', observaciones);
    formData.append('etiquetas',     etiquetasArr.join(','));
    formData.append('tipoPago',      tipoPago);
    formData.append('momento',       momento);
    formData.append('es_ingreso',    conceptoTipoActual === 'ingreso' ? 1 : 0); // <--- NUEVO
    
    if (momento === 'fecha') {
      formData.append('fechaElegida', fechaElegida);
    } else if (momento === 'recurrente') {
      formData.append('diaRecurrente', diaRecurrente);
      formData.append('frecuencia',    frecuencia);
    }
  
    // Imagen (si existe)
    const fileInput = $('#imagenCompra')[0];
    if (fileInput.files && fileInput.files.length > 0) {
      formData.append('imagenCompra', fileInput.files[0]);
    }
  


    // Envío con AJAX
    $.ajax({
      url: '../Componentes/assets/addMovimientos/conexionPrincipal.php',
      type: 'POST',
      data: formData,
      processData: false,   // importante para FormData
      contentType: false,  
      dataType: 'json', 
      success(response) 
      {
        if(response.success)
        {
          // 1) Cerramos modal y overlay
          $('#overlay').fadeOut(150);
          $('#modal').fadeOut(150);
          $('body').removeClass('modal-open');

          // 2) Mostramos el mensaje
          showSuccessMessage('Movimiento añadido correctamente');

          clearModalInputs();
          if (window.reiniciarYcargar) window.reiniciarYcargar();
          if (window.reiniciarYcargarComparar) window.reiniciarYcargarComparar();
          if (window.updateCharts) window.updateCharts();
          
        }
        $btn.prop('disabled', false);
      },
      error(xhr, status, error) {
        console.error(error);
        $btn.prop('disabled', false);
      }
    });
  });
  
  
  // Al escribir en los inputs, si se ingresa texto, se remueven los errores
  $("#cantidad, #selectedConcepto").on('input', function() {
    if ($(this).val().trim().length >= 0) 
    { 
      $(this).closest('.input-container').removeClass('error');

      $(this).css("border", ""); // Quitar el estilo inline para que el CSS de :focus se aplique
      $(this).siblings('.bad-text').css("display", "none");
    }
  });
  
  // Función para mostrar el mensaje de éxito fuera del modal
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

  // Limpia todos los inputs y estados del modal
  function clearModalInputs() {
    // Cantidad y signo
    $('#cantidad').val('').css('border', '');
    $('#plusBtn').removeClass('active');
    $('#minusBtn').addClass('active');

    // Moneda
    $('#selectedCurrency').val('EUR');
    $('#currencyDisplay').text('€');

    // Concepto
    $('#selectedConcepto').val('');
    $('#conceptoDisplay').text('Seleccionar concepto');

    // Observaciones
    $('#observaciones').val('');

    // Etiquetas (usa tu array global y renderizado)
    etiquetasSeleccionadas = [];
    renderChips();
    updateDropdown();

    // Tipo de pago
    $('input[name="tipoPago"][value="cuenta"]').prop('checked', true);

    // Momento
    $('input[name="momento"][value="ahora"]').prop('checked', true);
    $('#fechaContainer, #recurrenteContainer').hide();

    // Fecha / recurrente
    $('#diaRecurrente').val('');
    $('#frecuenciaDisplay').text('Mensual');
    $('#frecuenciaOptions').hide();

    // Imagen
    $('#imagenCompra').val('');
    $('#uploadedPreview').hide();
    $('.upload-label').show();

    // Errores y estilos
    $('.bad-text').hide();
    $('.input-container').removeClass('error');
  }


});




  
