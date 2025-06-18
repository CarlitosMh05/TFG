$(document).ready(function () {
    $("#next").click(function(event) {
        event.preventDefault();
        
        let email = $('#email').val().trim();
        let phone = $('#number').val().trim();
        let form1 = $('#form1').val().trim();

        // Remover cualquier error previo
        $('.input-container').removeClass('error');
        $('.bad-text').css("display", "none");
        $('.input-container input').css("border", "1px solid gray");

        let hasError = false;

        // Validar email
        if (!email) {
            $('.badMail').css("display", "block");
            $('#email').closest('.input-container').addClass('error');
            $('#email').css("border", "1px solid red");
            hasError = true;
        }

        // Validar teléfono
        if (!phone) {
            $('.badNumber').css("display", "block");
            $('#number').closest('.input-container').addClass('error');
            $('#number').css("border", "1px solid red");
            hasError = true;
        }

        // Validar formato del correo
        let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (email && !regex.test(email)) {
            $('.badMail').html("Debe ingresar un correo válido").css("display", "block");
            $('#email').closest('.input-container').addClass('error');
            $('#email').css("border", "1px solid red");
            hasError = true;
        }

        if(hasError) return;
        
        // Mostrar animación de carga
        $('body').append('<div class="loading-overlay"><div class="spinner"></div></div>');

        $.ajax({
            url: 'enviarCorreo.php',
            type: 'POST',
            data: { email: email, phone: phone, form: form1 },
            success: function(response) 
            {
                $(".loading-overlay").remove(); // Eliminar animación de carga
                const data = JSON.parse(response);
                if(data.error)
                {
                    alert(data.error);
                } 
                else if(data.send) 
                {
                    
                    // Transición de formularios con empuje suave
                    let formContainer = $("form").parent();
                    let firstForm = $("form:first");
                    let secondForm = $("#nextStep");

                    secondForm.css({ display: "flex", transform: "translateY(100%)", transition: "transform 0.75s ease-in-out", width: "40%", position: "absolute" });
                    firstForm.css({ transform: "translateY(0)", transition: "transform 0.75s ease-in-out", width: "40%", position: "absolute" });

                    setTimeout(() => {
                        firstForm.css("transform", "translateY(-200%)");
                        secondForm.css("transform", "translateY(0)");
                    }, 100);

                    
                } 
                else if(data.noEmail)
                {
                    $('.badMail').html(data.noEmail).css("display", "block");
                    $('#email').closest('.input-container').addClass('error');
                    $('#email').css("border", "1px solid red");
                }
                else if(data.badNumber)
                {
                    $('.badNumber').html(data.badNumber).css("display", "block");
                    $('#number').closest('.input-container').addClass('error');
                    $('#number').css("border", "1px solid red");
                }

            },
            error: function(xhr, status, error) {
                $(".loading-overlay").remove(); // Eliminar animación de carga en caso de error
                alert("Error en la solicitud: " + error);
            }
        });
    });

    $("#next2").click(function(event)
    {
        event.preventDefault();
        
        let temporalPwd = $('#temporalPwd').val().trim();
        let newPwd = $('#newPassword').val().trim();
        let confirmationPwd = $('#confirmationPwd').val().trim();
        let email = $('#email').val().trim();
        let form2 = $('#form2').val().trim();

        // Remover cualquier error previo
        $('.input-container').removeClass('error');
        $('.bad-text').css("display", "none");
        $('.input-container input').css("border", "1px solid gray");

        let hasError = false;

        // Validar email
        if (!temporalPwd) {
            $('.badPwd').css("display", "block");
            $('#temporalPwd').closest('.input-container').addClass('error');
            $('#temporalPwd').css("border", "1px solid red");
            hasError = true;
        }

        // Validar teléfono
        if (!newPwd) {
            $('.badNewPwd').css("display", "block");
            $('#newPassword').closest('.input-container').addClass('error');
            $('#newPassword').css("border", "1px solid red");
            hasError = true;
        }
        else if (validarContraseña(newPwd) != "") 
        {
            $('.badNewPwd').html(validarContraseña(newPwd)).css("display", "block");
            $('#newPassword').closest('.input-container').addClass('error');
            $('#newPassword').css("border", "1px solid red");
            hasError = true;
        }

        // Validar teléfono
        if (!confirmationPwd) {
            $('.badConfirmationPwd').css("display", "block");
            $('#confirmationPwd').closest('.input-container').addClass('error');
            $('#confirmationPwd').css("border", "1px solid red");
            hasError = true;
        }
        
        if(hasError) return;

        $.ajax({
            url: 'enviarCorreo.php',
            type: 'POST',
            data: { temporalPwd: temporalPwd, newPwd: newPwd, confirmationPwd: confirmationPwd, form:form2, email: email },
            success: function(response) 
            {
                const data = JSON.parse(response);
                if(data.error) 
                {
                    alert(data.error);
                } 
                else if(data.pwdActualizada) 
                {
                    $("#nextStep").hide(); // Ocultar el formulario actual
                    $("#succes").fadeIn(500); // Mostrar el mensaje de éxito

                    setTimeout(() => {
                        window.location.href = "../Principal/principal.php";
                    }, 20000); // Espera 1 segundo antes de redirigir
                } 
                else if(data.badTemporalPwd)  
                {
                    $('.badPwd').html(data.badTemporalPwd).css("display", "block");
                    $('#temporalPwd').closest('.input-container').addClass('error');
                    $('#temporalPwd').css("border", "1px solid red");
                }
                else if(data.noCoinciden)  
                {
                    $('.badConfirmationPwd').html(data.noCoinciden).css("display", "block");
                    $('#confirmationPwd').closest('.input-container').addClass('error');
                    $('#confirmationPwd').css("border", "1px solid red");
                }
            },
            error: function(xhr, status, error) 
            {
                alert("Error en la solicitud: " + error);
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

    // Al escribir en los inputs, si se ingresa texto, se remueven los errores
    $("#email, #temporalPwd, #newPassword, #confirmationPwd, #number" ).on('input', function() {
        if ($(this).val().trim().length > 0) {
            $(this).closest('.input-container').removeClass('error');
            $(this).css("border", ""); // Quitar el estilo inline para que el CSS de :focus se aplique
            $(this).siblings('.bad-text').css("display", "none");
        }
    });

    // Actualiza la barra de progreso de la contraseña mientras se escribe
    $("#newPassword").on('input', function() {
        let passwordStrength = 0;
        let passwordValue = $(this).val();

        if ($(this).val().trim().length == 0) 
        {
            $(".badPwd").html('Debe introducir una contraseña');
        }
        // Mostrar la barra de progreso cuando empiece a escribir
        if (passwordValue.length > 0) {
            $(".password-strength").show(); // Muestra la barra de progreso
        }
        else {
            $(".password-strength").hide(); // Oculta la barra si el input está vacío
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
    $('#newPassword').on('input', function () {
      if ($(this).val().length > 0) {
        $toggle.fadeIn(200);
      } else {
        $toggle.fadeOut(200);
      }
    });
});

function togglePassword() {
    const passwordInput = document.getElementById("newPassword");
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

