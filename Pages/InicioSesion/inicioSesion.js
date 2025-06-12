

$(document).ready(function () {
    $("#next").click(function(event) {
        event.preventDefault();

        const email = $('#email').val().trim();
        const contraseña = $('#password').val().trim();

        // Remover cualquier error previo
        $('.input-container').removeClass('error');
        $('.bad-text').css("display", "none");
        $('.input-container input').css("border", "1px solid gray");

        let hasError = false;

        // Validar email
        if (!email) {
            $('.badEmail').css("display", "block");
            $('#email').closest('.input-container').addClass('error');
            $('#email').css("border", "1px solid red");
            hasError = true;
        }

        // Validar contraseña
        if (!contraseña) {
            $('.badPwd').css("display", "block");
            $('#password').closest('.input-container').addClass('error');
            $('#password').css("border", "1px solid red");
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

        if(hasError) return;
        
        //Conexión con la base de datos
        $.ajax({
            url: 'inicioSesion.php',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: {  email: email, contraseña: contraseña },

            success: function (response)
            {
                const data = JSON.parse(response);
                if(data.error)
                {
                    alert(data.error);
                    return;
                }
                else if(data.noEmail)
                {
                    $('.badEmail').html(data.noEmail).css("display", "block");
                    $('#email').closest('.input-container').addClass('error');
                    $('#email').css("border", "1px solid red");
                }
                else if(data.badPwd)
                {
                    $('.badPwd').html(data.badPwd).css("display", "block");
                    $('#password').closest('.input-container').addClass('error');
                    $('#password').css("border", "1px solid red");
                }
                else
                {
                    window.location.href = "../Principal/principal.php";
                }
                
            },

            error: function(xhr, status, error) {
                console.error("Error AJAX:", status, error);
                console.error("Respuesta del servidor:", xhr.responseText);
                alert("Error en la solicitud: " + error);
            }
        });
    });

    // Al escribir en los inputs, si se ingresa texto, se remueven los errores
    $("#email, #password").on('input', function() {
        if ($(this).val().trim().length >= 0) {
            // Remueve la clase de error del contenedor y restablece el borde y el mensaje
            $(this).closest('.input-container').removeClass('error');
            $(this).css("border", ""); // Quitar el estilo inline para que el CSS de :focus se aplique
            $(this).siblings('.bad-text').css("display", "none");
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

    // Al escribir en los inputs, si se ingresa texto, se remueven los errores
    $("#email, #password, #nombre, #number" ).on('input', function() {
        if ($(this).val().trim().length > 0) {
            $(this).closest('.input-container').removeClass('error');
            $(this).css("border", ""); // Quitar el estilo inline para que el CSS de :focus se aplique
            $(this).siblings('.bad-text').css("display", "none");
            $("#password").closest(".input-container").show();
        }
        
    });
    
});

// Función para obtener parámetros de la URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Al cargar la página, rellenar el campo de correo si el parámetro 'email' existe
window.onload = function() {
    const email = getUrlParameter('email');
    if (email) {
        document.getElementById('email').value = email;
    }
};


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