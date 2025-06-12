$(document).ready(function () {
    $("#next").click(function(event) {
        event.preventDefault();

        
        const email = $('#email').val().trim();
        const contraseña = $('#password').val().trim();
        const nombre = $('#nombre').val().trim();
        const telefono = $('#number').val().trim();

        // Remover cualquier error previo
        $('.input-container').removeClass('error');
        $('.bad-text').css("display", "none");
        $('.input-container input').css("border", "");

        let hasError = false;

        // Validar email
        if (!email) {
            $('.badEmail').css("display", "block");
            $('#email').closest('.input-container').addClass('error');
            $('#email').css("border", "1px solid red !important");
            hasError = true;
        }

        // Validar contraseña
        if(!contraseña)
        {
            $('.badPwd').html("Debe introducir una contraseña").css("display", "block");
            $('#password').closest('.input-container').addClass('error');
            $('#password').css("border", "1px solid red");
            hasError = true;
        }
        else if (validarContraseña(contraseña) != "") {
            $('.badPwd').html(validarContraseña(contraseña)).css("display", "block");
            $('#password').closest('.input-container').addClass('error');
            $('#password').css("border", "1px solid red");
            hasError = true;
        }

        

        // Validar contraseña
        if (!nombre) {
            $('.badName').css("display", "block");
            $('#nombre').closest('.input-container').addClass('error');
            $('#nombre').css("border", "1px solid red");
            hasError = true;
        }

        // Validar contraseña
        if (!telefono) {
            $('.badNumber').css("display", "block");
            $('#number').closest('.input-container').addClass('error');
            $('#number').css("border", "1px solid red");
            hasError = true;
        }

        // Validar formato del correo
        let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (email && !regex.test(email)) {
            $('.badEmail').html("Debe ingresar un correo válido").css("display", "block");
            $('#email').closest('.input-container').addClass('error');
            $('#email').css("border", "1px solid red");
            hasError = true;
        }

        //Validar longitud del numero
        if (telefono.length != 9) {
            $('.badNumber').html("El número tiene que tener 9 dígitos.").css("display", "block");
            $('#number').closest('.input-container').addClass('error');
            $('#number').css("border", "1px solid red");
            hasError = true;
        }

        if(hasError) return;
        
        $.post('checkEmail.php', { email: $('#email').val().trim() }, function(res) {
            if (res.exists) {
              $('.badEmail').html('El correo ya está en uso. Quieres <a href="../InicioSesion/inicioSesion.html">Iniciar Sesion</a>').show();
              $('#email').closest('.input-container').addClass('error');
              $('#email').css('border','1px solid red');
            } else {
              // sólo si no existe, desliza al paso 2
              $("#slider").css("transform","translateX(-50%)");
            }
        }, 'json');


        $("#back").click(function() {
            $("#slider").css("transform","translateX(0)");
        });

        $('input[name="addMoney"]').on('change', function() {
            if (this.value === 'yes') {
                $(".money-form").stop(true).slideDown(400);
            } else {
              // “No”: volvemos al primer paso y ocultamos sub-formulario
              $(".money-form").stop(true).slideUp(400);
            }
          });
        
          // lógica de enable/disable de los inputs
          // arranca con #amountAll habilitado y los otros dos disabled
          $("#amountAll").on('focus', function() 
          {
            $(this).prop("disabled", false);
            $("#account, #cash").prop("disabled", true);
          });

          $("#account, #cash").on('focus', function() 
          {
            $(this).prop("disabled", false);
            $("#amountAll").prop("disabled", true);
          });


          $('input[name="amountType"]').change(function() {
            if (this.value === 'all') 
            {
              $("#amountAll").prop("disabled", false).removeClass("input-error");
              $("#account, #cash").prop("disabled", true).removeClass("input-error");
            } 
            else 
            {
              $("#amountAll").prop("disabled", true).removeClass("input-error");
              $("#account, #cash").prop("disabled", false).removeClass("input-error");
            }
        });

        $("#createUser").click(function() {
            
            // 1) ¿Añade saldo ahora o lo deja para luego?
            const addMoney = $('input[name="addMoney"]:checked').val(); // "yes" ó "no"
            let amtType = $('input[name="amountType"]:checked').val();
            let valid = true;

            // 2) Preparamos las dos variables que enviaremos
            let cuentaVal, efectivoVal;
            if (addMoney === 'yes') 
            {

              if (amtType === 'all') 
              {
                
                cuentaVal   = $('#amountAll').val() || 0;
                efectivoVal = 'NULL';        

                if (!$('#amountAll').val()) 
                {
                  $('.badAmount').html("Debe ingresar una cantidad").css("display", "block");
                  $('#amountAll').closest('.input-container').addClass('error');
                  $('#amountAll').css("border", "1px solid red");
                  valid = false;
                }
              } 
              else 
              {
                cuentaVal   = $('#account').val() || 0;
                efectivoVal = $('#cash').val()    || 0;

                if (!$('#account').val()) 
                {
                  $('.badAccount').html("Debe ingresar una cantidad").css("display", "block");
                  $('#account').closest('.input-container').addClass('error');
                  $('#account').css("border", "1px solid red");
                  valid = false;
                }
                if (!$('#cash').val()) 
                {
                  $('.badCash').html("Debe ingresar una cantidad").css("display", "block");
                  $('#cash').closest('.input-container').addClass('error');
                  $('#cash').css("border", "1px solid red");
                  valid = false;
                }
              }
            } 
            else 
            {
              // No quiere añadir saldo ahora → inicializamos en cero y NULL
              cuentaVal   = 0;
              efectivoVal = 'NULL';
            }

            if (!valid) return;
            
            

            // 3) Montamos el objeto data con esas dos claves
            const data = {
              nombre:     $('#nombre').val().trim(),
              email:      $('#email').val().trim(),
              contraseña: $('#password').val().trim(),
              telefono:   $('#number').val().trim(),
              cuenta:     cuentaVal,
              efectivo:   efectivoVal
            };
            
        
            $.ajax({
              url: 'crearCuenta.php',
              type: 'POST',
              data: data,
              
              success(response) {
                const res = JSON.parse(response);
                if (res.error)     
                {
                  alert(res.error);
                } 
                else if (res.alredyEmail) 
                {
                  $('.badEmail').html(res.alredyEmail).show();
                  $('#email').closest('.input-container').addClass('error');
                  $('#email').css("border", "1px solid red");

                } 
                else 
                {
                  window.location.href = "../Principal/principal.php";
                }
              },
              error(xhr, status, err) {
                console.error("Error AJAX:", status, err);
                alert("Error en la solicitud: " + err);
              }
            });
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
    });

    // Al escribir en los inputs, si se ingresa texto, se remueven los errores
    $("#cash, #account, #amountAll" ).on('input', function() {
        if ($(this).val().trim().length > 0) {
            $(this).closest('.input-container').removeClass('error');
            $(this).css("border", ""); // Quitar el estilo inline para que el CSS de :focus se aplique
            $(this).siblings('.bad-text').css("display", "none");
            $("#password").closest(".input-container").show();
        }
        
    });

    // Actualiza la barra de progreso de la contraseña mientras se escribe
    $("#password").on('input', function() {
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
            $("#password").closest(".input-container").addClass("show-strength");
        }
        else {
            $(".password-strength").hide(); // Oculta la barra si el input está vacío
            $("#password").closest(".input-container").removeClass("show-strength");
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
    $('#password').on('input', function () {
      if ($(this).val().length > 0) {
        $toggle.fadeIn(200);
      } else {
        $toggle.fadeOut(200);
      }
    });

    // Al hacer foco o escribir en un number, quitamos el border inline
  $('#amountAll, #account, #cash')
  .on('focus input', function() {
    // elimina la propiedad inline border (puedes quitar sólo border o todo style)
    $(this).css('border', ''); 
    // o bien $(this).removeAttr('style');
  });
    
});


function togglePassword() {
    const passwordInput = document.getElementById("password");
    const icon = document.getElementById("icon");
    const isPassword = passwordInput.type === "password";

    // Animación de salida
    icon.classList.add("animate");

    // Esperar la animación de salida antes de cambiar el icono
    setTimeout(() => {
      passwordInput.type = isPassword ? "text" : "password";
      icon.textContent = isPassword ? "visibility_off" : "visibility";

      // Animación de entrada
      icon.classList.remove("animate");
    }, 50); // Tiempo justo para que se vea la transición
}

  