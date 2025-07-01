document.addEventListener('DOMContentLoaded', function() {
  /*Funciones de la barra lateral*/
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebarMenu');
  const sideOverlay = document.getElementById('sidebarOverlay');
  const links = document.querySelectorAll('.sidebar-link');

  // Toggle menu - Versión optimizada con toggle
  hamburgerBtn.addEventListener('click', function() {
     
    hamburgerBtn.classList.toggle('active');
    sidebar.classList.toggle('open');
    sideOverlay.classList.toggle('active');
    
    // Gestionar estilos del body y posición del botón
    if (hamburgerBtn.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
      hamburgerBtn.style.position = "fixed";
    } else {
      document.body.style.overflow = '';
      hamburgerBtn.style.position = "absolute";
    }
  });

  // Close menu on overlay click
  sideOverlay.addEventListener('click', function() {
    hamburgerBtn.classList.remove('active');
    sidebar.classList.remove('open');
    sideOverlay.classList.remove('active');
    document.body.style.overflow = '';
    hamburgerBtn.style.position = "fixed";
  });

  // Close menu when clicking links
  links.forEach(link => {
    link.addEventListener('click', function() {
      hamburgerBtn.classList.remove('active');
      sidebar.classList.remove('open');
      sideOverlay.classList.remove('active');
      document.body.style.overflow = '';
      hamburgerBtn.style.position = "fixed";
    });
  });

  // ICONS (Lucide)
  if (window.lucide) lucide.createIcons();


  let lastScrollTop = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > lastScrollTop) {
      // Scroll down → ocultar
      hamburgerBtn?.classList.remove('show-on-scroll');
      hamburgerBtn?.classList.add('hide-on-scroll');

      
    } else {
      // Scroll up → mostrar
      hamburgerBtn?.classList.add('show-on-scroll');
      hamburgerBtn?.classList.remove('hide-on-scroll');

      
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });

});