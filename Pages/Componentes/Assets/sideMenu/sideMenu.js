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
    hamburgerBtn.style.position = "absolute";
  });

  // Close menu when clicking links
  links.forEach(link => {
    link.addEventListener('click', function() {
      hamburgerBtn.classList.remove('active');
      sidebar.classList.remove('open');
      sideOverlay.classList.remove('active');
      document.body.style.overflow = '';
      hamburgerBtn.style.position = "absolute";
    });
  });

  // ICONS (Lucide)
  if (window.lucide) lucide.createIcons();
});