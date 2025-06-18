
window.onload = function() 
{
    document.body.style.overflowY = "hidden"; // Bloquea el scroll
    setTimeout(() => {
        document.body.style.overflowY = "auto"; // Lo habilita después del tiempo
    }, 3000); // Tiempo en milisegundos

    // Mostrar el primer h1 después de 0 segundos
    setTimeout(function() {
        document.getElementById("titulo1").style.opacity = 1;
    }, 750);
    
    // Mostrar el segundo h1 después de 1 segundo
    setTimeout(function() {
        document.getElementById("titulo2").style.opacity = 1;
    }, 1500);
    
    // Mostrar el botón después de 2 segundos
    setTimeout(function() {
        document.getElementById("btn").style.opacity = 1;
    }, 2250);

   

    setTimeout(function() {
        document.getElementById("shadow").style.opacity = 1;
    }, 3000);

    setTimeout(function() {
        document.getElementById("btn2").style.opacity = 1;
    }, 3000);
    
    
};

function initScrollAnimations({
    elementsSelector = ".scroll-animation",
    animationType = "translateY",
    animationDistance = "50px",
    duration = "1s",
    threshold = 0.2
} = {}) 
{
    const elementos = document.querySelectorAll(elementsSelector);
    let lastScrollY = window.scrollY; // Guardamos la última posición del scroll

    const observer = new IntersectionObserver((entries) => {
        let currentScrollY = window.scrollY;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = `opacity ${duration} ease-out, transform ${duration} ease-out`;

                if (animationType === "translateY") {
                    entry.target.style.transform = `translateY(0)`;
                } else if (animationType === "fade") {
                    entry.target.style.opacity = "1";
                }

                entry.target.style.opacity = "1";
            } else {
                // Solo desaparece si el usuario está haciendo scroll hacia arriba
                if (currentScrollY < lastScrollY) {
                    if (animationType === "translateY") {
                        entry.target.style.transform = `translateY(${animationDistance})`;
                    } else if (animationType === "scale") {
                        entry.target.style.opacity = "0";
                    }

                    entry.target.style.opacity = "0";
                }
            }
        });

        lastScrollY = currentScrollY; // Actualizamos la última posición del scroll
    }, { threshold });

    elementos.forEach(el => observer.observe(el));
}





document.addEventListener("DOMContentLoaded", () => {
    initScrollAnimations({
        elementsSelector: ".text1-animation",
        animationType: "translateY",
        animationDistance: "100px",
        duration: "0.8s",
        threshold: 0.3,
    });

    initScrollAnimations({
        elementsSelector: ".fade",
        animationType: "fade",
        duration: "1.5s",
        threshold: 0.6,
    });

    const popup = document.getElementById('cookieConsentPopup');
    if (!popup) return;
    const acceptBtn = document.getElementById('cookieAcceptBtn');
    const rejectBtn = document.getElementById('cookieRejectBtn');

    function handleConsent(consent) {
        fetch(CONSENT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consent: consent ? 1 : 0 })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                // Guarda en localStorage con expiración (milisegundos)
                const item = {
                    hash: data.hash,
                    consent: consent ? 1 : 0,
                    expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 año
                };
                localStorage.setItem(COOKIE_KEY, JSON.stringify(item));
            }
            popup.classList.remove('show');
            setTimeout(() => popup.style.display = 'none', 600);
        });
    }

    acceptBtn.addEventListener('click', () => handleConsent(true));
    rejectBtn.addEventListener('click', () => handleConsent(false));
});


// --- Configuración ---
const COOKIE_KEY = 'cookie_consent'; // Nombre en localStorage
const CONSENT_API = '../../cookie_consent.php'; // Cambia ruta si tu php está en otra carpeta

// --- Función para mostrar popup después de las animaciones ---
function showCookiePopupIfNeeded() {
    // ¿Ya aceptó/rechazó?
    if (localStorage.getItem(COOKIE_KEY)) return;

    // Espera a que acaben las animaciones (3s en tu web)
    setTimeout(() => {
        const popup = document.getElementById('cookieConsentPopup');
        if (popup) popup.classList.add('show');
    }, 3050); // Un pelín más para asegurar que todo cargó
}

window.addEventListener('DOMContentLoaded', showCookiePopupIfNeeded);










