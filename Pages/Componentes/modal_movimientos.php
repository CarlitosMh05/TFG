<!-- Botón flotante -->
<div class="floating-button-container">
  <button class="floating-button" id="addBtn">
    <i data-lucide="plus"></i>
    <span class="tooltip">Añadir movimiento</span>
  </button>
</div>
    
  <!-- Overlay + Modal -->
<div class="overlay" id="overlay"></div>
<form class="modal" id="modal" enctype="multipart/form-data">
  <h3>Añadir movimiento</h3>
  
  <!-- Fila 1: Cantidad + Concepto -->
  <div class="row">
    <div class="input-container amount-with-currency">

      <div class="sign-toggle">
        <button type="button" id="plusBtn" class="sign-btn ">
          <i data-lucide="plus"></i>
        </button>
        <button type="button" id="minusBtn" class="sign-btn active">
          <i data-lucide="minus"></i>
        </button>
      </div>

      <input type="number" id="cantidad" placeholder=" " required>
      <label for="cantidad" id="labelCantidad">Cantidad</label>
      
      <!-- Dropdown monedas -->
      <div class="currency-dropdown">
        <input type="hidden" id="selectedCurrency" value="EUR">
        <div class="currency-display" id="currencyDisplay">€</div>
        <ul class="currency-options" id="currencyOptions">
          <li data-value="EUR" data-symbol="€">EUR (€)</li>
          <li data-value="USD" data-symbol="$">USD ($)</li>
          <li data-value="GBP" data-symbol="£">GBP (£)</li>
          <li data-value="JPY" data-symbol="¥">JPY (¥)</li>
        </ul>
      </div>
      
      <p class="badCuantity bad-text">Debes introducir una cantidad</p>
    </div>
    
    <!-- Dropdown concepto -->
    <div class="input-container">

      <div class="concepto-dropdown">
        <div class="concepto-display" id="conceptoDisplay">Seleccionar concepto</div>
        <ul class="concepto-options" id="conceptoOptions">
        </ul>
      </div>

      <input type="hidden" id="selectedConcepto" required>
      <label for="concepto" id="concepto">Concepto</label>
      <p class="badConcept bad-text">Debes seleccionar un concepto</p>
    </div>
    
  </div>
  
  <!-- Fila 2: Observaciones + Etiquetas -->
  <div class="row">

    <!-- Observaciones -->
    <div class="input-container observaciones-container">
      <textarea id="observaciones" placeholder=" "></textarea>
      <label for="observaciones" id="labelObservaciones">Observaciones (opcional)</label>
    </div>
    
    <!-- Etiquetas -->
    <div class="input-container etiqueta-container">
      <div class="etiqueta-dropdown">
        <div class="etiqueta-display" id="etiquetaDisplay">Seleccionar etiquetas</div>
        
        <div class="info-icon-wrapper" id="infoIcon">
          <div class="info-icon" id="">i</div>
        </div>
        
        <ul class="etiqueta-options" id="etiquetaOptions">
          <li class="add-new" data-type="etiqueta">+ Añadir etiqueta</li>  
        </ul>
      </div>
      
      <input type="hidden" id="etiqueta" required>
      <label for="etiqueta" id="labelEtiqueta">Etiquetas (Opcional)</label>
      <p class="badEtiqueta bad-text">Debes seleccionar un etiqueta</p>
      
      <div class="chips-container" id="chipsContainer"></div>
    </div>
  </div>
  
  <!-- Fila 3: Botones -->
  <div class="row radios-row">

    <!-- Tipo de pago -->
    <div class="radio-container" id="tipoPagoContainer" style="opacity: 1;" >
      <label><input type="radio" name="tipoPago" value="cuenta" checked> Desde la cuenta</label>
      <label><input type="radio" name="tipoPago" value="efectivo"> Efectivo</label>
    </div>
    
    <!-- Momento del movimiento -->
    <div class="radio-container">
      <label><input type="radio" name="momento" value="ahora" checked> Ahora</label>
      <label><input type="radio" name="momento" value="fecha"> Elegir fecha</label>
      <label><input type="radio" name="momento" value="recurrente"> Recurrente</label>
      
      <!-- Contenedor de fecha -->
      <div class="fecha-container" id="fechaContainer">
        <div class="input-container "  style="width: 100%;">
          <input type="text" id="fechaElegida" placeholder=" ">
          <label for="fechaElegida">Fecha</label>
        </div>
      </div>
      
      <!-- Contenedor recurrente -->
      <div class="recurrente-container" id="recurrenteContainer">
        <div class="row">
          <div class="input-container recurrente-dia" id="inputRecurrencia">
            <input type="number" id="diaRecurrente" placeholder=" " required>
            <label for="diaRecurrente">Día</label>
          </div>
          
          <div class="input-container recurrente-tipo">
            <div class="frecuencia-dropdown">
              <div class="frecuencia-display" id="frecuenciaDisplay">Mensual</div>
              <ul class="frecuencia-options" id="frecuenciaOptions">
                <li data-value="Mensual">Mensual</li>
                <li data-value="Trimestral">Trimestral</li>
                <li data-value="Semestral">Semestral</li>
                <li data-value="Anual">Anual</li>
              </ul>
            </div>
            <input type="hidden" id="frecuenciaRecurrente" value="Mensual">
          </div>
        </div>

      </div>
    </div>

  </div>
  
  <div class="lastRow">

  
    <!-- Subir imagen -->
    <div class="modal-file-upload">
      <input type="file" id="imagenCompra" name="imagenCompra" accept="image/*" hidden>
      <div id="imageLoadingSpinner" class="spinner" style="display: none;"></div>
      <!-- Label inicial -->
      <label for="imagenCompra" class="upload-label">Foto compra, ticket, factura... (Opcional)</label>
      
      <!-- Vista previa -->
      <div class="uploaded-preview" id="uploadedPreview" style="display: none;">
        <img id="previewImg" src="" alt="Imagen subida">
        
        <div class="file-name-container">
          <span class="file-name-wrapper">
            <span class="file-name" id="fileName" title=""></span>
            <div class="file-name-tooltip" id="fileNameTooltip"></div>
          </span>
          <span class="remove-image" id="removeImage">✕</span>
        </div>
      </div>
    </div>

    <!-- Botón crear-->
    <div class="modal-actions">
      <button type="submit" id="confirmBtn">Añadir movimiento</button>
    </div>
  </div>

</form>  

<!-- Tooltip de mensaje con video de etiquta, fuera del modal para evitar clipping -->
<div class="info-tooltip" id="infoTooltip">
  <div class="tooltip-text">
    Usa etiquetas para agrupar gastos relacionados, como un viaje o proyecto. <br><br>Así en un futuro podrás revisarlos más fácilmente.
  </div>
  <!-- <div class="tooltip-video">
    <video autoplay muted loop playsinline>
      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
      Tu navegador no soporta videos HTML5.
    </video>
  </div> -->
</div>