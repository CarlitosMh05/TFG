


document.addEventListener('DOMContentLoaded', function () {
  const avatarBtn = document.getElementById('userAvatarBtn');
  const modal = document.getElementById('perfilModal');
  const overlay = document.getElementById('perfilModalOverlay');
  const closeBtn = document.getElementById('perfilModalClose');
  const menuItems = document.querySelectorAll('.perfil-modal-menu li');
  const sectionContents = document.querySelectorAll('.section-content');

  function openModal() {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    cargarConceptosPerfil();
  }
  function closeModal() {
    modal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  avatarBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Cambio de sección
  menuItems.forEach(item => {
    item.addEventListener('click', function () {
      menuItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      const section = this.getAttribute('data-section');
      sectionContents.forEach(cont => {
        if (cont.getAttribute('data-section') === section) cont.classList.add('active');
        else cont.classList.remove('active');
      });
      $(`[data-section="${section}"]`).trigger('section:show');
    });
  });

  function cargarConceptosPerfil() {
    // 1. INGRESOS
    $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=ingreso', function(data) {
      const listaIngreso = $('#listaConceptosIngreso');
      listaIngreso.empty();
      (data.conceptos || []).forEach(function(c) {
        listaIngreso.append(`
          <li data-id="${c.id}" data-nombre="${c.nombre}">
            <span>${c.nombre}</span>
            <button class="eliminar-concepto" title="Eliminar concepto">&times;</button>
          </li>
        `);
      });
    });
    // 2. GASTOS
    $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=gasto', function(data) {
      const listaGasto = $('#listaConceptosGasto');
      listaGasto.empty();
      (data.conceptos || []).forEach(function(c) {
        listaGasto.append(`
          <li data-id="${c.id}" data-nombre="${c.nombre}">
            <span>${c.nombre}</span>
            <button class="eliminar-concepto" title="Eliminar concepto">&times;</button>
          </li>
        `);
      });
    });
  }

  // Añadir ingreso
  $('#añadirConceptoIngresoBtn').on('click', function() {
    const nombre = $('#nuevoConceptoIngresoInput').val().trim();
    if (!nombre) return;
    $.post('../Componentes/Assets/userAvatar/addConcepto.php', { nombre, tipo: 1 }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Concepto de ingreso añadido correctamente');
        $('#nuevoConceptoIngresoInput').val('');
        cargarConceptosPerfil();
      } else if (resp.alredyExists) {
        showFailMessage(resp.alredyExists);
      }
      else {
        showFailMessage('Error al añadir concepto');
      }
    }, 'json');
  });

  // Añadir gasto
  $('#añadirConceptoGastoBtn').on('click', function() {
    const nombre = $('#nuevoConceptoGastoInput').val().trim();
    if (!nombre) return;
    $.post('../Componentes/Assets/userAvatar/addConcepto.php', { nombre, tipo: 0 }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Concepto de gasto añadido correctamente');
        $('#nuevoConceptoGastoInput').val('');
        cargarConceptosPerfil();
      } else if (resp.alredyExists) {
        showFailMessage(resp.alredyExists);
      }
      else {
        showFailMessage('Error al añadir concepto');
      }
    }, 'json');
  });

  // Eliminar concepto (en ambos)
  $('.conceptos-list').on('click', '.eliminar-concepto', function() {
    const nombre = $(this).closest('li').data('nombre');
    const id = $(this).closest('li').data('id');
    let tipo = null;
    if ($(this).closest('#listaConceptosIngreso').length) {
        tipo = 'ingreso';
    } else if ($(this).closest('#listaConceptosGasto').length) {
        tipo = 'gasto';
    }
    $.post('../Componentes/Assets/userAvatar/deleteConcepto.php', {id}, function(resp) {
      if (resp.success) 
      {
        cargarConceptosPerfil();
        updateCharts();
      } 
    }, 'json');
  });

  // Cargar cuando se entra en la sección
  $('[data-section="conceptos"]').on('section:show', cargarConceptosPerfil);

  const darkSwitch = document.getElementById('darkModeSwitch');
  // Al iniciar, leemos la preferencia
  if (localStorage.getItem('darkMode') === 'on') {
    document.body.classList.add('dark-mode');
    if (darkSwitch) darkSwitch.checked = true;
  }
  // Al cambiar el switch
  if (darkSwitch) {
    darkSwitch.addEventListener('change', function () {
      if (this.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'on');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'off');
      }
      // Mostrar toast/aviso de cambio
      showSuccessMessage('Preferencia de modo oscuro guardada');
    });
  }

  function cargarConceptos() {
    $.getJSON('../Componentes/Assets/fetchOptions.php', function(data) {
      const lista = $('#listaConceptos');
      lista.empty();
      (data.conceptos || []).forEach(function(item) {
        lista.append(`
          <li data-id="${item}">
            ${item}
            <button class="eliminar-concepto" title="Eliminar concepto">&times;</button>
          </li>
        `);
      });
    });
  }

  // Añadir concepto
  $('#añadirConceptoBtn').on('click', function() {
    const nombre = $('#nuevoConceptoInput').val().trim();
    if (!nombre) return;
    $.post('../Componentes/Assets/userAvatar/addConcepto.php', { nombre }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Concepto añadido correctamente');
        $('#nuevoConceptoInput').val('');
        cargarConceptos();
      } else {
        showSuccessMessage('Error al añadir concepto');
      }
    }, 'json');
  });

  // Eliminar concepto
  $('.conceptos-list').on('click', '.eliminar-concepto', function() {
    const $li = $(this).closest('li');
    const nombre = $li.data('nombre');
    const id = $li.data('id');
    let tipo = null;
    if ($(this).closest('#listaConceptosIngreso').length) {
        tipo = 'ingreso';
    } else if ($(this).closest('#listaConceptosGasto').length) {
        tipo = 'gasto';
    }
    conceptoAEliminar = { id, nombre, tipo };

    // Intentar borrar normalmente
    $.post('../Componentes/Assets/userAvatar/deleteConcepto.php', { id }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Concepto eliminado');
        cargarConceptosPerfil();
      } else if (resp.movimientos) {
        // Si hay movimientos asociados, muestra el modal
        $('#deleteConceptoTitle').text(`No se puede eliminar el concepto "${nombre}" directamente`);
        $('#deleteConceptoOverlay, #deleteConceptoModal').fadeIn(120);
      } else {
        showSuccessMessage('Error al eliminar concepto');
      }
    }, 'json');
  });

  // Cancelar modal
  $('#cancelDeleteConcepto').on('click', function() {
    $('#deleteConceptoOverlay, #deleteConceptoModal').fadeOut(120);
    conceptoAEliminar = null;
  });

  // Eliminar todo (movimientos + concepto)
  $('#confirmDeleteConcepto').on('click', function() {
    if (!conceptoAEliminar) return;
    $.post('../Componentes/Assets/userAvatar/deleteConcepto.php', { id: conceptoAEliminar.id, force: 1 }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Concepto y movimientos eliminados');
        $('#deleteConceptoOverlay, #deleteConceptoModal').fadeOut(120);
        cargarConceptosPerfil();
        updateCharts();
        conceptoAEliminar = null;
      } 
      else
      {
        showSuccessMessage('Error al eliminar concepto');
      }
    }, 'json');
  });


  // Cargar al entrar en la sección
  $('[data-section="conceptos"]').on('section:show', cargarConceptos);


  function cargarEtiquetas() {
    $.getJSON('../Componentes/Assets/fetchOptions.php', function(data) {
      const lista = $('#listaEtiquetas');
      lista.empty();
      if (data.etiquetas == null)
      {
        alert('No hay etiquetas definidas');
        lista.append(``);
      }
      else
      {
        (data.etiquetas || []).forEach(function(item) {
          lista.append(`
            <li data-id="${item.id}" data-nombre="${item.nombre}">
              <span>${item.nombre}</span>
              <button class="eliminar-etiqueta" title="Eliminar etiqueta">&times;</button>
            </li>
          `);
        });
      }
      
    });
    cargarDropdownEtiquetas();
  }

  // Añadir etiqueta
  $('#añadirEtiquetaBtn').on('click', function() {
    const nombre = $('#nuevaEtiquetaInput').val().trim();
    if (!nombre) return;
    $.post('../Componentes/Assets/userAvatar/addEtiqueta.php', { nombre }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Etiqueta añadida correctamente');
        $('#nuevaEtiquetaInput').val('');
        cargarEtiquetas();
      } else if (resp.alredyExists) {
        showFailMessage(resp.alredyExists);
      }
      else {
        showFailMessage('Error al añadir concepto');
      }
    }, 'json');
  });

  // Eliminar etiqueta
  $('#listaEtiquetas').on('click', '.eliminar-etiqueta', function() {
    const id = $(this).closest('li').data('id');
    $.post('../Componentes/Assets/userAvatar/deleteEtiqueta.php', { id }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Etiqueta eliminada');
        cargarEtiquetas();
      } 
      else {
        showSuccessMessage('Error al eliminar etiqueta');
      }
    }, 'json');
  });

  // Cargar al entrar en la sección
  $('[data-section="etiquetas"]').on('section:show', cargarEtiquetas);

  /*Usuario*/
  function cargarDatosUsuario() {
  $.getJSON('../Componentes/Assets/userAvatar/fetchUsuario.php', function(data) {
    if (data.success && data.usuario) {
      $('#userNombre').text(data.usuario.nombre || '');
      $('#userCorreo').text(data.usuario.correo || '');
      $('#userTelefono').text(data.usuario.telefono || '');
      $('#userPassword').text('*********');
    }
  });
}

// Al entrar a la sección usuario, carga los datos
$('[data-section="usuario"]').on('section:show', cargarDatosUsuario);
    

    // Handlers para cambiar correo, teléfono, contraseña
    $('.user-edit-btn').on('click', function() {
      const tipo = $(this).data('type');
    let titulo = '', actual = '', placeholder = '', inputType = 'text', labelActual = '';
    $('#containerMiniModalInputNuevoValor, #containerMiniModalInputNuevoValor2, #containerMiniModalInputPass, #containerMiniModalInputPass2').hide();

    $('.user-edit-btn').removeClass('active');
    $(this).addClass('active');

    if (tipo === 'nombre') {
      titulo = 'Cambiar nombre';
      actual = $('#userNombre').text();
      placeholder = 'Nuevo nombre';
      inputType = 'text';
      labelActual = 'Nombre actual:';
      $('#containerMiniModalInputNuevoValor').show();
      $('#miniModalInput').attr('type', inputType).val('');
      $('#labelMiniModalInput').text(placeholder);

      $('#containerMiniModalInputNuevoValor2').show();
      $('#miniModalInput2').attr('type', inputType).val('');
      $('#labelMiniModalInput2').text('Confirmar nuevo nombre');

    }
    if (tipo === 'correo') {
      titulo = 'Cambiar correo';
      actual = $('#userCorreo').text();
      placeholder = 'Nuevo correo';
      inputType = 'email';
      labelActual = 'Correo actual:';
      $('#containerMiniModalInputNuevoValor').show();
      $('#miniModalInput').attr('type', inputType).val('');
      $('#labelMiniModalInput').text(placeholder); // O el texto que toque

      $('#containerMiniModalInputNuevoValor2').show();
      $('#miniModalInput2').attr('type', inputType).val('');
      $('#labelMiniModalInput2').text('Confirmar nuevo correo');

    }
    if (tipo === 'telefono') {
      titulo = 'Cambiar teléfono';
      actual = $('#userTelefono').text();
      placeholder = 'Nuevo teléfono';
      inputType = 'tel';
      labelActual = 'Teléfono actual:';
      $('#containerMiniModalInputNuevoValor').show();
      $('#miniModalInput').attr('type', inputType).val('');
      $('#labelMiniModalInput').text(placeholder); // O el texto que toque

      $('#containerMiniModalInputNuevoValor2').show();
      $('#miniModalInput2').attr('type', inputType).val('');
      $('#labelMiniModalInput2').text('Confirmar nuevo telefono');

    }
    if (tipo === 'contrasena') {
      titulo = 'Cambiar contraseña';
      labelActual = '';
      $(".password-strength").hide();

      $('#containerMiniModalInputPass').show();
      $('#miniModalInputPass').val('');
      $('#labelMiniModalInputPass').text('Nueva contraseña');

      $('#containerMiniModalInputPass2').show();
      $('#miniModalInputPass2').val('');
      $('#labelMiniModalInputPass2').text('Confirmar contraseña');

     
    }
    $('#miniModalTitle').text(titulo);
    $('#miniModalActualLabel').text(labelActual);
    $('#miniModalActualValue').text(actual);
    $('#miniModalError').hide();
    $('#miniModalOverlay, #miniModal').fadeIn(120);

    $('.input-container').removeClass('error');
    $('.bad-text').css("display", "none");
    $('.input-container input').css("border", "");
    
  });

  // Cancelar mini-modal
  $('.mini-modal-cancel').on('click', function() {
    $('#miniModalOverlay, #miniModal, #deleteUserOverlay, #deleteUserModal').fadeOut(120);
    $('#miniModalInput, #miniModalInputPass, #miniModalInputPass2').val('');
  });

  function validarContraseña(contraseña) {
    // Expresiones regulares para los diferentes requisitos
    const longitudMinima = /^(?=.{8,})/;  // Mínimo 8 caracteres
    const mayuscula = /[A-Z]/;            // Al menos una mayúscula
    const minuscula = /[a-z]/;            // Al menos una minúscula
    const numero = /\d/;                  // Al menos un número
    
    var stringReturn = "";
    // Verificar si la contraseña cumple con los requisitos
    if (!longitudMinima.test(contraseña)) {
        stringReturn += "-Debe tener, al menos, 8 caracteres <br>";
    }
    if (!mayuscula.test(contraseña)) {
        stringReturn += "-Debe tener, al menos, una mayuscula <br>";
    }
    if (!minuscula.test(contraseña)) {
        stringReturn += "-Debe tener, al menos, una miniscula <br>";
    }
    if (!numero.test(contraseña)) {
        stringReturn += "-Debe tener, al menos, un numero <br>";
    }
    

    return stringReturn; // Si pasa todas las validaciones, no hay error
  }

  // Confirmar cambios en mini-modal
  $('.mini-modal-confirm').on('click', function() {
    let tipo = $('.user-edit-btn.active').data('type');
    let val, val2;
    if (tipo === 'nombre' || tipo === 'correo' || tipo === 'telefono') {
      val = $('#miniModalInput').val().trim();
      val2 = $('#miniModalInput2').val().trim();

      if (!val && !val2) 
      { 
        $('#containerMiniModalInputNuevoValor').addClass('error');
        $('#miniModalInput').css('border', '1px solid red');

        $('#containerMiniModalInputNuevoValor2').addClass('error');
        $('#badNuevoValor2').text('Debes rellenar ambos campos').show();
        $('#miniModalInput2').css('border', '1px solid red');

        
        return;
      }
      if (!val && val2) 
      { 
        $('#containerMiniModalInputNuevoValor').addClass('error');
        $('#badNuevoValor').text('Debes rellenar ambos campos').show();
        $('#miniModalInput').css('border', '1px solid red');

        return;
      }
      if (val && !val2) 
      { 
        $('#containerMiniModalInputNuevoValor2').addClass('error');
        $('#badNuevoValor2').text('Debes rellenar ambos campos').show();
        $('#miniModalInput2').css('border', '1px solid red');

        return;
      }
      if (val !== val2) 
      { 
        $('#containerMiniModalInputNuevoValor2').addClass('error');
        $('#badNuevoValor2').text('El valor de confirmación no coincide').show();
        $('#miniModalInput2').css('border', '1px solid red');

       return; 
      }
    }
    

    if (tipo === 'contrasena') 
    {
      val = $('#miniModalInputPass').val().trim();
      val2 = $('#miniModalInputPass2').val().trim();

      if (validarContraseña(val) != "") 
      { 
        $('#containerMiniModalInputPass').addClass('error');
        $('#badNuevaPass').html(validarContraseña(val)).show();
        $('#miniModalInputPass').css('border', '1px solid red');

        return; 
      }

      if (val && !val2) 
      { 
       
        $('#containerMiniModalInputPass2').addClass('error');
        $('#badNuevaPass2').text('Debes rellenar ambos campos').show();
        $('#miniModalInputPass2').css('border', '1px solid red');

        return; 
      }

      if (val !== val2) 
      { 
        $('#containerMiniModalInputPass2').addClass('error');
        $('#badNuevaPass2').text('El valor de confirmación no coincide').show();
        $('#miniModalInputPass2').css('border', '1px solid red');
        
        return; 
      }
      
      
    }
    // Enviar AJAX según el tipo
    let url = '';
    if (tipo === 'nombre') url = '../Componentes/Assets/userAvatar/updateNombre.php';
    if (tipo === 'correo') url = '../Componentes/Assets/userAvatar/updateCorreo.php';
    if (tipo === 'telefono') url = '../Componentes/Assets/userAvatar/updateTelefono.php';
    if (tipo === 'contrasena') url = '../Componentes/Assets/userAvatar/updateContrasena.php';
    $.post(url, { valor: val }, function(resp) {
      if (resp.success) 
      {
        showSuccessMessage('Dato actualizado');
        cargarDatosUsuario();
        if(tipo === 'nombre') $("#nombreSaludo").text("Hola, " + resp.nombre);
        
        $('#miniModalOverlay, #miniModal').fadeOut(120);
        $('#miniModalInput, #miniModalInput2, #miniModalInputPass, #miniModalInputPass2').val('');
      } else {
        $('#miniModalError').text(resp.error || 'Error al actualizar.').show();
      }
    }, 'json');
  });

  // Actualiza la barra de progreso de la contraseña mientras se escribe
  $("#miniModalInputPass").on('input', function() {
    let passwordStrength = 0;
    let passwordValue = $(this).val();

    if ($(this).val().trim().length == 0) 
    {
      $(".badPwd").html('Debe introducir una contraseña');
    }
    // Mostrar la barra de progreso cuando empiece a escribir
    if (passwordValue.length > 0) 
    {
        $(".password-strength").show(); // Muestra la barra de progreso
        $("#miniModalInputPass").closest(".input-container").addClass("show-strength");
    }
    else {
        $(".password-strength").hide(); // Oculta la barra si el input está vacío
        $("#miniModalInputPass").closest(".input-container").removeClass("show-strength");
    }

    // Fuerzas básicas: longitud, letras, números, caracteres especiales
    if (passwordValue.length >= 8) passwordStrength += 25;
    if (/[a-z]/.test(passwordValue)) passwordStrength += 25;
    if (/[A-Z]/.test(passwordValue)) passwordStrength += 25;
    if (/\d/.test(passwordValue)) passwordStrength += 25;

    // Cambiar el color de la barra según la fuerza
    let progressBar = $(".progress-bar");
    progressBar.css("width", passwordStrength + "%");
      
    const validPwd = false;

    if (passwordStrength <= 25) {
        progressBar.css("background-color", "red");
    } else if (passwordStrength <= 50) {
        progressBar.css("background-color", "orange");
    } else if (passwordStrength <= 75) {
        progressBar.css("background-color", "yellow");
    } else 
    {
        progressBar.css("background-color", "green");
        
    }

  });

  const $toggle = $('.toggle-password');
  $('#miniModalInputPass').on('input', function () {
    if ($(this).val().length > 0) {
      $toggle.fadeIn(200);
    } else {
      $toggle.fadeOut(200);
    }
  });

  showPasswordBtn

 
  $('#showPasswordBtn').on('click', function() {
    const $passwordInput = $('#miniModalInputPass');
    const $icon = $('#icon');
    const isPassword = $passwordInput.attr('type') === 'password';

    // Animación de salida
    $icon.addClass('animate');

    // Esperar la animación de salida antes de cambiar el icono
    setTimeout(function() {
      $passwordInput.attr('type', isPassword ? 'text' : 'password');
      $icon.text(isPassword ? 'visibility_off' : 'visibility');

      // Animación de entrada
      $icon.removeClass('animate');
    }, 50); // Tiempo justo para que se vea la transición
  });


  

  // Al escribir en los inputs, si se ingresa texto, se remueven los errores
  $("#miniModalInput, #miniModalInput2, #miniModalInputPass, #miniModalInputPass2" ).on('input', function() {
      if ($(this).val().trim().length > 0) {
          $(this).closest('.input-container').removeClass('error');
          $(this).css("border", ""); // Quitar el estilo inline para que el CSS de :focus se aplique
          $(this).siblings('.bad-text').css("display", "none");
      }
      
  });

  // Eliminar usuario
  $('#eliminarUsuarioBtn').on('click', function() {
    $('#deleteUserOverlay, #deleteUserModal').fadeIn(120);
  });
  $('#cancelDeleteUser').on('click', function() {
    $('#deleteUserOverlay, #deleteUserModal').fadeOut(120);
  });
  $('#confirmDeleteUser').on('click', function() {
    $.post('../Componentes/Assets/userAvatar/deleteUsuario.php', {}, function(resp) {
      if (resp.success) {
        showSuccessMessage('Usuario eliminado');
        setTimeout(() => { window.location.href = '../Componentes/Assets/userAvatar/logout.php'; }, 750);
      } else {
        showSuccessMessage('Error al eliminar usuario');
      }
    }, 'json');
  });

  $('#cerrarSesionBtn').on('click', function() {
    // Redirige al usuario a un PHP que destruya la sesión y vuelva al login
    window.location.href = '../Componentes/Assets/userAvatar/logout.php';
  });

  $('#miniModalOverlay').on('click', function () {
    $('#miniModalOverlay, #miniModal').fadeOut(120);
    $('#miniModalInput, #miniModalInput2, #miniModalInputPass, #miniModalInputPass2').val('');
    $('#miniModalError').hide();
    $('.user-edit-btn').removeClass('active');
  });
  $('#deleteUserOverlay').on('click', function () {
    $('#deleteUserOverlay, #deleteUserModal').fadeOut(120);
  });
  $('#deleteConceptoOverlay').on('click', function () {
    $('#deleteConceptoOverlay, #deleteConceptoModal').fadeOut(120);
  });

  let conceptoAEliminar = null; // ¡Ya tienes esta variable!

  // Al pulsar "Editar movimientos"
  $('#editarMovimientosConcepto').on('click', function() {
    // Oculta el modal de borrar concepto
    $('#deleteConceptoOverlay, #deleteConceptoModal').fadeOut(120);

    // Saca nombre/id/tipo del concepto a eliminar
    const conceptoId = conceptoAEliminar.id;
    const conceptoNombre = conceptoAEliminar.nombre;
    const conceptoTipo = conceptoAEliminar.tipo; // 'ingreso' o 'gasto'

    // 1. Consulta AJAX para saber si es ingreso o gasto y para traer la lista de conceptos posibles
    $.getJSON(`../Componentes/Assets/fetchOptions.php?id_concepto=${conceptoId}&tipo=${conceptoTipo}`, function(data) {
      // data.tipo_concepto: 'ingreso' o 'gasto'
      // data.conceptos: lista de conceptos posibles del mismo tipo (con id y nombre)

      // Guarda tipo global para añadir nuevos conceptos si hace falta
      window.tipoConceptoEdicion = data.tipo_concepto;

      // Monta las opciones del dropdown igual que en el modal de añadir movimiento
      const $opts = $('#editConceptoOptions');
      $opts.empty();

      // Añade barra de búsqueda como en el modal de movimientos
      $opts.append(`
        <li class="search-item">
          <div class="input-container search-container">
            <input type="text" class="search-input" placeholder=" ">
            <label style="left: 33px;">Buscar concepto…</label>
            <i data-lucide="search" class="search-icon"></i>
          </div>
        </li>
      `);
      lucide.createIcons();

      // Añade conceptos, excluyendo el propio a eliminar
      data.conceptos.filter(c => c.id != conceptoId).forEach(c => {
        $opts.append(`<li data-id="${c.id}">${c.nombre}</li>`);
      });
      

      // Vacía selección previa
      $('#editConceptoDisplay').text('Selecciona concepto').removeData('id');
      $('#editMovsConceptoError').hide();

      // Título y descripción
      $('#editMovsConceptoTitle').text(`Cambiar el concepto de: "${conceptoNombre}" por:`);
      $('#editMovsConceptoDesc').text(`Eliminar el concepto "${conceptoNombre}" y sustituirlo por el concepto elegido, en todos los movimientos.`);

      // Muestra modal
      $('#editMovsConceptoOverlay, #editMovsConceptoModal').fadeIn(120);

      // --- Dropdown logica ---
      $('#editConceptoDisplay').off().on('click', function() {
        $('#editConceptoOptions').fadeToggle(150);
        $(this).toggleClass('open');
      });
      // Cierra el dropdown al hacer click fuera
      $(document).off('.editConceptoDropdown').on('click.editConceptoDropdown', function(e) {
        if (!$(e.target).closest('#editConceptoDropdown').length) {
          $('#editConceptoOptions').fadeOut(150);
          $('#editConceptoDisplay').removeClass('open');
        }
      });

      // Selecciona concepto
      $opts.off('click', 'li[data-id]').on('click', 'li[data-id]', function() {
        const id = $(this).data('id');
        const nombre = $(this).text();
        $('#editConceptoDisplay').text(nombre).data('id', id);
        $('#editConceptoOptions').fadeOut(150);
        $('#editConceptoDisplay').removeClass('open');
        $('#editMovsConceptoError').hide();
      });

      // Añadir concepto nuevo en línea
      $opts.off('click', 'li.add-new').on('click', 'li.add-new', function() {
        const $li = $(this);
        $li.removeClass('add-new').addClass('adding')
          .html(`
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

        // Enter: crear concepto
        $input.on('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            const nombreNuevo = $input.val().trim();
            if (!nombreNuevo) {
              $error.text('El nombre no puede estar vacío.').show();
              $error[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              return;
            }
            $input.prop('disabled', true);
            $error.hide();
            $spin.show();
            $.post('../Componentes/Assets/userAvatar/addConcepto.php', {
              nombre: nombreNuevo,
              tipo: window.tipoConceptoEdicion === 'ingreso' ? 1 : 0
            }, function(resp) {
              $spin.hide();
              if (resp.success && resp.id) {
                // Inserta el nuevo concepto en la lista y selecciónalo
                const $newLi = $(`<li data-id="${resp.id}">${resp.nombre}</li>`);
                $li.before($newLi);
                $('#editConceptoDisplay').text(resp.nombre).data('id', resp.id);
                $li.removeClass('adding').addClass('add-new').html('+ Añadir concepto');
                $li.closest('ul').find('.adding').remove(); // quita posibles añadidos duplicados
                $('#editConceptoOptions').fadeOut(150);
                $('#editConceptoDisplay').removeClass('open');
                $('#editMovsConceptoError').hide();
              } 
              else if(resp.alredyExists)
              {
                $input.prop('disabled', false);
                $error.text(resp.error || 'Ese concepto ya existe').show();
              }
              else
              {
                $input.prop('disabled', false);
                $error.text(resp.error || 'Error al añadir concepto').show();
              }
            }, 'json').fail(() => {
              $spin.hide();
              $input.prop('disabled', false);
              $error.text('Error de red').show();
              $error[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
          }
          // Esc para cancelar
          else if (e.key === 'Escape') {
            $li.removeClass('adding').addClass('add-new').html('+ Añadir concepto');
          }
        });

        // Click fuera para cancelar
        $(document).on('mousedown.inlineAdd', ev => {
          if (!$li.is(ev.target) && $li.has(ev.target).length === 0) {
            $li.removeClass('adding').addClass('add-new').html('+ Añadir concepto');
            $(document).off('mousedown.inlineAdd');
          }
        });
      });

      // Búsqueda
      $opts.off('input', '.search-input').on('input', '.search-input', function() {
        const q = this.value.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        $opts.find('li[data-id]').each(function() {
          const txt = $(this).text().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          $(this).toggle(txt.includes(q));
        });
      });

    });
  });

  // Cancelar
  $('#cancelEditMovsConcepto, #editMovsConceptoOverlay').on('click', function() {
    $('#editMovsConceptoOverlay, #editMovsConceptoModal').fadeOut(120);
    $('#editConceptoOptions').hide();
  });

  // Confirmar
  $('#confirmEditMovsConcepto').on('click', function() {
    const nuevoId = $('#editConceptoDisplay').data('id');
    if (!nuevoId) {
      $('#editMovsConceptoError').text('Selecciona un concepto válido').show();
      return;
    }
    // Envía la petición para cambiar todos los movimientos
    $.post('../Componentes/Assets/userAvatar/deleteConcepto.php', {
      id: conceptoAEliminar.id,
      nuevo_concepto_id: nuevoId,
      editar_movimientos: 1
    }, function(resp) {
      if (resp.success) {
        showSuccessMessage('Movimientos actualizados y concepto eliminado');
        $('#editMovsConceptoOverlay, #editMovsConceptoModal').fadeOut(120);
        // Actualiza la UI como en los otros casos
        cargarConceptosPerfil();
        if (window.reiniciarYcargar) window.reiniciarYcargar();
        if (window.reiniciarYcargarComparar) window.reiniciarYcargarComparar();
        if (window.updateCharts) window.updateCharts();
      } else {
        $('#editMovsConceptoError').text(resp.error || 'Error al actualizar').show();
      }
    }, 'json');
  });



  function cargarDropdownEtiquetas() {
    $.getJSON('../Componentes/Assets/fetchOptions.php', function(data) {
      etiquetasList = [{id: null, nombre: 'Sin etiqueta'}].concat(data.etiquetas || []);
      const $options = $('#etiquetaShowOptions');
      $options.empty();
      etiquetasList.forEach(etq => {
        $options.append(
          `<li data-id="${etq.id === null ? '' : etq.id}">${etq.nombre}</li>`
        );
      });
      // Actualiza el display
      const selected = etiquetasList.find(e => String(e.id) === String(selectedEtiquetaId)) || etiquetasList[0];
      $('#etiquetaShowDisplay').text(selected.nombre);
    });
  }

  const $inputContainerEtiqueta = $('#etiquetaShowDisplay').closest('.input-container');

  $('#etiquetaShowDisplay').on('click', function () {
    cargarDropdownEtiquetas();
    $('#etiquetaShowOptions').fadeToggle(150);
    $(this).toggleClass('open');
    $inputContainerEtiqueta.toggleClass('open');
    $('#etiquetaShow').toggleClass('open');
  });

  $('#etiquetaShowOptions').on('click', 'li', function () {
    const id = $(this).data('id');
    selectedEtiquetaId = (id === '' || id === undefined) ? null : id;
    $('#etiquetaShowDisplay').text($(this).text()).removeClass('open');
    $('#etiquetaShowOptions').fadeOut(150);
    $inputContainerEtiqueta.removeClass('open');
    $('#etiquetaShow').removeClass('open');
    updateCharts();
  });

  document.addEventListener('click', function (e) {
    const display = document.getElementById('etiquetaShowDisplay');
    const options = document.getElementById('etiquetaShowOptions');
    const label = document.getElementById('etiquetaShow');
    if (display && options && !display.contains(e.target) && !options.contains(e.target) && (!label || !label.contains(e.target))) {
      options.style.display = 'none';
      display.classList.remove('open');
      $inputContainerEtiqueta.removeClass('open');
      if(label) label.classList.remove('open');
    }
  });

  // Llama a cargarDropdownEtiquetas() al iniciar
  cargarDropdownEtiquetas();
});



//Funciones de pestaña de Predeterminados

function cargarOpcionesPredeterminadas() {
  $('#predEtiquetaDisplay').off('click');
  $(document).off('mousedown.predEtiqueta');
  $('#predEtiquetaOptions').off('click', 'li');
  $('#predChipsContainer').off('click', '.chip');
  let conceptosIngreso = [];
  let conceptosGasto = [];
  let etiquetasTotales = [];

  // Paso 1: Fetch conceptos ingreso
  $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=ingreso', function (data) {
    conceptosIngreso = data.conceptos || [];
    const $ul = $('#predConceptoIngresoOptions').empty();
    conceptosIngreso.forEach(c => {
      $ul.append(`<li data-id="${c.id}">${c.nombre}</li>`);
    });
  });

  // Paso 2: Fetch conceptos gasto
  $.getJSON('../Componentes/Assets/fetchOptions.php?tipo=gasto', function (data) {
    conceptosGasto = data.conceptos || [];
    const $ul = $('#predConceptoGastoOptions').empty();
    conceptosGasto.forEach(c => {
      $ul.append(`<li data-id="${c.id}">${c.nombre}</li>`);
    });
  });

  // Paso 3: Fetch etiquetas
  $.getJSON('../Componentes/Assets/fetchOptions.php', function (data) {
    etiquetasTotales = data.etiquetas || [];

    const $ul = $('#predEtiquetaOptions').empty();
    $ul.append(`
      <li class="search-item">
        <div class="input-container search-container">
          <input type="text" class="search-input" placeholder=" ">
          <label style="left: 33px; color: black !important;">Buscar etiqueta…</label>
          <i data-lucide="search" class="search-icon"></i>
        </div>
      </li>
    `);
    lucide.createIcons();

    etiquetasTotales.forEach(et => {
      $ul.append(`<li data-value="${et.id}">${et.nombre}</li>`);
    });

    
  });

  // Paso 4: Obtener predeterminados ya guardados
  $.getJSON('../Componentes/Assets/userAvatar/getPredeterminados.php', function (resp) {
    if (!resp.success) return;

    // Ingreso
    if (resp.concepto_ingreso_id && conceptosIngreso.length > 0) {
      const item = conceptosIngreso.find(c => c.id == resp.concepto_ingreso_id);
      if (item) {
        $('#predConceptoIngresoDisplay').text(item.nombre).data('id', item.id);
      }
    }

    // Gasto
    if (resp.concepto_gasto_id && conceptosGasto.length > 0) {
      const item = conceptosGasto.find(c => c.id == resp.concepto_gasto_id);
      if (item) {
        $('#predConceptoGastoDisplay').text(item.nombre).data('id', item.id);
      }
    }

    // Tipo movimiento por defecto
    if (resp.tipo_default) {
      const capitalizado = resp.tipo_default.charAt(0).toUpperCase() + resp.tipo_default.slice(1);
      $('#tipoMovimientoDisplay').text(capitalizado).data('tipo', resp.tipo_default);
    }

    
  });

  
  // VARIABLES Y REFERENCIAS PARA LA PARTE DE PREDICCIONES
  const predChipsContainer = $('#predChipsContainer');
  const predEtiquetaOptions = $('#predEtiquetaOptions');
  const predEtiquetaDisplay = $('#predEtiquetaDisplay');
  let etiquetasPredSeleccionadas = [];

  // Renderizar chips
  function renderPredChips() {
    predChipsContainer.empty();

    etiquetasPredSeleccionadas.forEach(etiqueta => {
      const chip = $(`
        <div class="chip" data-value="${etiqueta}">
          ${etiqueta}
          <button class="remove-chip" title="Eliminar etiqueta">×</button>
        </div>
      `);
      predChipsContainer.append(chip);
    });

    updatePredCompactHeight();

    if (etiquetasPredSeleccionadas.length < 5) {
      predEtiquetaOptions.find('li.add-new').show();
      predEtiquetaOptions.find('.search-input').prop('disabled', false);
    }
  }

  // Actualizar el dropdown
  function updatePredDropdown() {
    predEtiquetaOptions.empty();

    // Search bar
    predEtiquetaOptions.append(`
      <li class="search-item">
        <div class="input-container search-container">
          <input type="text" class="search-input" placeholder=" ">
          <label style="left: 33px; color: black !important;">Buscar etiqueta…</label>
          <i data-lucide="search" class="search-icon"></i>
        </div>
      </li>
    `);
    lucide.createIcons();

    const disponibles = (etiquetasTotales || []).filter(et => !etiquetasPredSeleccionadas.includes(et.nombre));

    disponibles.forEach(et => {
      predEtiquetaOptions.append(`<li data-value="${et.nombre}">${et.nombre}</li>`);
    });
  }

  // Actualizar altura
  function updatePredCompactHeight() {
    const isSingleLine = predChipsContainer.height() <= 30;
    const container = predEtiquetaDisplay.closest('.input-container');
    if (isSingleLine && etiquetasPredSeleccionadas.length > 0) {
      container.addClass('compact');
    } else {
      container.removeClass('compact');
    }
  }

  // Mostrar opciones
 // Mostrar opciones del dropdown de etiquetas
  $('#predEtiquetaDisplay').on('click', function (e) {
    e.stopPropagation(); // Evita que el evento llegue al documento
    const isOpen = $(this).hasClass('open');
    $('#predEtiquetaOptions').fadeToggle(150);
    $(this).toggleClass('open');

    const label = $(this).closest('.input-container').find('label');
    if (isOpen) {
      label.css('color', 'gray');
    } else {
      label.css('color', 'var(--azulPrimario)');
    }
  });



  // Cerrar el dropdown al hacer clic fuera de él
  $(document).on('mousedown.predEtiqueta', function (e) {
    const $target = $(e.target);
    const clickedInsidePredEtiqueta = $target.closest('#predEtiquetaDisplay').length > 0 || $target.closest('#predEtiquetaOptions').length > 0;

    if (!clickedInsidePredEtiqueta) {
      $('#predEtiquetaOptions').fadeOut(150);
      $('#predEtiquetaDisplay').removeClass('open');
      $('#predEtiquetaDisplay').closest('.input-container').find('label').css('color', 'gray');
    }
  });

  // Seleccionar etiqueta
  predEtiquetaOptions.off('click', 'li')
    .on('click', 'li[data-value]', function () {
      const value = $(this).attr('data-value');

      if (etiquetasPredSeleccionadas.length >= 5) {
        const container = predEtiquetaDisplay.closest('.input-container');
        if (container.find('.error-limit').length === 0) {
          const $msg = $('<div class="error-limit" style="color: red; margin: 5px 0;" >Máximo 5 etiquetas</div>');
          container.append($msg);
          setTimeout(() => $msg.fadeOut(300, () => $msg.remove()), 2000);
        }
        return;
      }

      if (!etiquetasPredSeleccionadas.includes(value)) {
        etiquetasPredSeleccionadas.push(value);
        renderPredChips();
        updatePredDropdown();
        predEtiquetaOptions.fadeOut(150);
        predEtiquetaDisplay.removeClass('open');
      }

      predEtiquetaDisplay.closest('.input-container').find('label').css('color', 'gray');
    });

  // Eliminar chip
  predChipsContainer.on('click', '.chip', function () {
    const value = $(this).attr('data-value');
    etiquetasPredSeleccionadas = etiquetasPredSeleccionadas.filter(et => et !== value);
    renderPredChips();
    updatePredDropdown();
  });


  // Inicializar
  renderPredChips();
  updatePredDropdown();

}

// Ejecutar al entrar en la sección
$('[data-section="predeterminados"]').on('section:show', cargarOpcionesPredeterminadas);










// Click en el display de concepto ingreso
$('#predConceptoIngresoDisplay').on('click', function (e) {
  const $disp = $(this);
  const $cont = $disp.closest('.input-container');
  const $options = $('#predConceptoIngresoOptions');

  $options.fadeToggle(150);
  $disp.toggleClass('open');

  $cont.find('label').css('color',
    $disp.hasClass('open') ? 'var(--azulPrimario)' : 'gray');
});

// Click en una opción de ingreso
$('#predConceptoIngresoOptions').off('click', 'li[data-id]')
  .on('click', 'li[data-id]', function (e) {
    const value = $(this).text();
    const $disp = $('#predConceptoIngresoDisplay');
    const $cont = $disp.closest('.input-container');

    $disp.text(value).removeClass('open');
    $('#predConceptoIngresoOptions').fadeOut(150);

    $cont.find('label').css('color', 'gray');
    $disp.data('id', $(this).data('id'));
});

$('#predConceptoGastoDisplay').on('click', function (e) {
  const $disp = $(this);
  const $cont = $disp.closest('.input-container');
  const $options = $('#predConceptoGastoOptions');

  $options.fadeToggle(150);
  $disp.toggleClass('open');

  $cont.find('label').css('color',
    $disp.hasClass('open') ? 'var(--azulPrimario)' : 'gray');
});

$('#predConceptoGastoOptions').off('click', 'li[data-id]')
  .on('click', 'li[data-id]', function (e) {
    const value = $(this).text();
    const $disp = $('#predConceptoGastoDisplay');
    const $cont = $disp.closest('.input-container');

    $disp.text(value).removeClass('open');
    $('#predConceptoGastoOptions').fadeOut(150);

    $cont.find('label').css('color', 'gray');
    $disp.data('id', $(this).data('id'));
});


$('#tipoMovimientoDisplay').on('click', function (e) {
  const $disp = $(this);
  const $cont = $disp.closest('.input-container');
  const $options = $('#tipoMovimientoOptions');

  $options.fadeToggle(150);
  $disp.toggleClass('open');

  $cont.find('label').css('color',
    $disp.hasClass('open') ? 'var(--azulPrimario)' : 'gray');
});

$('#tipoMovimientoOptions').off('click', 'li[data-value]')
  .on('click', 'li[data-value]', function (e) {
    const value = $(this).text();
    const $disp = $('#tipoMovimientoDisplay');
    const $cont = $disp.closest('.input-container');

    $disp.text(value).removeClass('open');
    $('#tipoMovimientoOptions').fadeOut(150);

    $cont.find('label').css('color', 'gray');
    $disp.data('tipo', $(this).data('value'));
});



$(document).on('mousedown', function (e) {
  const $target = $(e.target);

  const clickedInsidePredEtiqueta = $target.closest('#predEtiquetaDisplay').length > 0 || $target.closest('#predEtiquetaOptions').length > 0;
  const clickedInsidePredIngreso = $target.closest('#predConceptoIngresoDisplay').length > 0 || $target.closest('#predConceptoIngresoOptions').length > 0;
  const clickedInsidePredGasto = $target.closest('#predConceptoGastoDisplay').length > 0 || $target.closest('#predConceptoGastoOptions').length > 0;
  const clickedInsideTipoMov = $target.closest('#tipoMovimientoDisplay').length > 0 || $target.closest('#tipoMovimientoOptions').length > 0;

  if (!clickedInsidePredEtiqueta) {
    $('#predEtiquetaOptions').fadeOut(150);
    $('#predEtiquetaDisplay').removeClass('open');
  }

  if (!clickedInsidePredIngreso) {
    $('#predConceptoIngresoOptions').fadeOut(150);
    $('#predConceptoIngresoDisplay').removeClass('open');
  }

  if (!clickedInsidePredGasto) {
    $('#predConceptoGastoOptions').fadeOut(150);
    $('#predConceptoGastoDisplay').removeClass('open');
  }

  if (!clickedInsideTipoMov) {
    $('#tipoMovimientoOptions').fadeOut(150);
    $('#tipoMovimientoDisplay').removeClass('open');
  }
});




// Interacciones
$(document).on('click', '#predConceptoIngresoOptions li', function() {
  const id = $(this).data('id');
  $('#predConceptoIngresoDisplay').text($(this).text()).data('id', id);
  $('#predConceptoIngresoOptions').fadeOut(150);
});

$(document).on('click', '#predConceptoGastoOptions li', function() {
  const id = $(this).data('id');
  $('#predConceptoGastoDisplay').text($(this).text()).data('id', id);
  $('#predConceptoGastoOptions').fadeOut(150);
});



$('#guardarPredeterminadosBtn').on('click', function() {
  const data = {
    concepto_ingreso_id: $('#predConceptoIngresoDisplay').data('id') || null,
    concepto_gasto_id: $('#predConceptoGastoDisplay').data('id') || null,
    tipo_default: $('#tipoMovimientoDefault').val(),
    etiquetas: etiquetasPred.map(e => e.id)
  };
  console.log(data);
  $.post('../Componentes/Assets/userAvatar/savePredeterminados.php', data, function(resp) {
    if (resp.success) {
      showSuccessMessage('Preferencias guardadas');
    } else {
      showFailMessage(resp.error || 'Error al guardar');
    }
  }, 'json');
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

function showFailMessage(text) {
  // Si ya existe, lo quitamos antes
  $('.success-alert').remove();

  // Creamos el div y lo preparamos
  const $alert = $('<div class="fail-alert"></div>').text(text);
  $('body').append($alert);

  // Slide down, esperar 3s, slide up y quitar
  $alert
      .slideDown(300)
      .delay(2000)
      .slideUp(300, function() { $(this).remove(); });
}
