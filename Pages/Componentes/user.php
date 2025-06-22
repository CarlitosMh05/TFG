<div class="user-avatar" id="userAvatarBtn" title="Perfil">
    <!-- Icono de usuario SVG -->
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
        <circle cx="19" cy="19" r="19" fill="#e4e8f1"/>
        <path d="M19 19c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm0 2c-4.418 0-8 2.239-8 5v2c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-2c0-2.761-3.582-5-8-5z" 
        fill="gray"/>
    </svg>
</div>


<div class="perfil-modal-overlay" id="perfilModalOverlay"></div>
<div class="perfil-modal" id="perfilModal">
    <div class="perfil-modal-header">
        <span class="perfil-modal-title">Perfil</span>
        <span class="perfil-modal-close" id="perfilModalClose">&times;</span>
    </div>
    <div class="perfil-modal-content">
        <aside class="perfil-modal-menu">
        <ul>
            <li data-section="personalizacion" class="active">Personalización</li>
            <li data-section="conceptos">Conceptos</li>
            <li data-section="etiquetas">Etiquetas</li>
            <li data-section="usuario">Usuario</li>
        </ul>
        </aside>
        <section class="perfil-modal-section" id="perfilModalSection">
        <!-- Aquí se muestra el contenido dinámico -->
        <div data-section="personalizacion" class="section-content active">
            <h3 style="margin-bottom: 30px;">Personalización</h3>
            <div class="darkmode-row">
            <span class="darkmode-label">Modo oscuro</span>
            <label class="switch">
                <input type="checkbox" id="darkModeSwitch">
                <span class="slider round"></span>
            </label>
            </div>
            <p class="darkmode-desc">Activa el modo oscuro para reducir el cansancio visual.</p>
        </div>

        <div data-section="conceptos" class="section-content">
            <h3 style="margin-bottom: 18px;">Conceptos</h3>
            <div class="conceptos-cols">
            <!-- Columna Ingresos -->
            <div class="conceptos-col">
                <div class="conceptos-title">De ingreso</div>
                <ul id="listaConceptosIngreso" class="conceptos-list"></ul>
                <div class="concepto-add-row">
                    <div class="input-container" id="containerMiniModalInputConceptoIngreso" >
                        <input id="nuevoConceptoIngresoInput" type="text" placeholder=" " autocomplete="off"/>
                        <label for="nuevoConceptoIngresoInput" id="labelInputConceptoIngresos">Nuevo concepto de ingreso...</label>
                        <p class="bad-text" id="badConceptoIngreso"></p>
                        <button id="añadirConceptoIngresoBtn" class="concepto-add-btn">Añadir</button>
                    </div>
                </div>
            </div>
            <!-- Columna Gastos -->
            <div class="conceptos-col">
                <div class="conceptos-title">De gasto</div>
                <ul id="listaConceptosGasto" class="conceptos-list"></ul>
                <div class="concepto-add-row">
                    <div class="input-container" id="containerMiniModalInputConceptoGasto" >
                        <input id="nuevoConceptoGastoInput" type="text" placeholder=" " autocomplete="off"/>
                        <label for="nuevoConceptoGastoInput" id="labelInputConceptoGasto">Nuevo concepto de gasto...</label>
                        <p class="bad-text" id="badConceptoGasto"></p>
                        <button id="añadirConceptoGastoBtn" class="concepto-add-btn">Añadir</button>
                    </div>
                    
                </div>
            </div>
            </div>
        </div>


        <div data-section="etiquetas" class="section-content">
            <h3 style="margin-bottom: 18px;">Etiquetas</h3>
            <div class="input-container" id="containerMiniModalInputEtiquetas" >
                <input id="nuevaEtiquetaInput" type="text" placeholder=" " autocomplete="off"/>
                <label for="nuevaEtiquetaInput" id="labelInputEtiqueta">Nueva etiqueta...</label>
                        <p class="bad-text" id="badEtiqueta"></p>
                <button id="añadirEtiquetaBtn" class="etiqueta-add-btn">Añadir</button>
            </div>
            <ul id="listaEtiquetas" class="etiquetas-list"></ul>
        </div>

        <li data-section="predeterminados">Predeterminados</li>

        <div class="section-content" data-section="predeterminados">
        <h3>Predeterminados</h3>

        <div class="conceptos-cols">
            <div class="conceptos-col">
            <div class="conceptos-title">Concepto Ingreso</div>
            <div class="input-container concepto-dropdown">
                <div id="predConceptoIngresoDisplay" class="concepto-display">Seleccionar concepto</div>
                <ul id="predConceptoIngresoOptions" class="concepto-options"></ul>
            </div>
            </div>
            <div class="conceptos-col">
            <div class="conceptos-title">Concepto Gasto</div>
            <div class="input-container concepto-dropdown">
                <div id="predConceptoGastoDisplay" class="concepto-display">Seleccionar concepto</div>
                <ul id="predConceptoGastoOptions" class="concepto-options"></ul>
            </div>
            </div>
        </div>

        <div class="conceptos-col">
            <div class="conceptos-title">Etiquetas</div>
            <div class="input-container etiqueta-dropdown">
            <div id="predEtiquetaDisplay" class="etiqueta-display">Seleccionar etiquetas</div>
            <ul id="predEtiquetaOptions" class="etiqueta-options"></ul>
            </div>
            <div id="predChipsContainer" class="chips-container"></div>
        </div>

        <div class="conceptos-col">
            <div class="conceptos-title">Ingresos / Gasto</div>
            <div class="input-container">
            <select id="tipoMovimientoDefault">
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
            </select>
            <p style="font-size: 13px; color: gray; margin-top: 6px;">
                Si eliges la opción de Ingreso, se activará por defecto la selección de Ingreso al añadir un movimiento.
            </p>
            </div>
        </div>

        <button id="guardarPredeterminadosBtn" class="concepto-add-btn" style="margin-top: 20px;">Guardar preferencias</button>
        </div>

        <div data-section="usuario" class="section-content">
            <h3 style="margin-bottom: 20px;">Datos de usuario</h3>

            <div class="user-data-row">
            <span class="user-label">Nombre:</span>
            <span class="user-value" id="userNombre"></span>
            <button class="user-edit-btn" data-type="nombre">Cambiar Nombre</button>
            </div>

            <div class="user-data-row">
            <span class="user-label">Correo:</span>
            <span id="userCorreo" class="user-value">ejemplo@email.com</span>
            <button class="user-edit-btn" data-type="correo">Cambiar Correo</button>
            </div>

            <div class="user-data-row">
            <span class="user-label">Teléfono:</span>
            <span id="userTelefono" class="user-value">000000000</span>
            <button class="user-edit-btn" data-type="telefono">Cambiar Teléfono</button>
            </div>

            <div class="user-data-row">
            <span class="user-label">Contraseña:</span>
            <span class="user-value">••••••••</span>
            <button class="user-edit-btn" data-type="contrasena">Cambiar Contraseña</button>
            </div>

            <div class="deleteCloseSesion">
            <button class="cerrar-sesion-btn" id="cerrarSesionBtn">Cerrar sesión</button>
            <button id="eliminarUsuarioBtn" class="eliminar-usuario-btn">Eliminar usuario</button>
            </div>
        </div>

        <!-- Mini modal para editar usuario -->
        <div class="mini-modal-overlay" id="miniModalOverlay"></div>
        <div class="mini-modal" id="miniModal">
            <div class="mini-modal-content">
            <h4 id="miniModalTitle"></h4>
            <div class="input-container" id="containerMiniModalInputNuevoValor" >
                <input id="miniModalInput" type="text" placeholder=" " />
                <label for="miniModalInput" id="labelMiniModalInput">Nuevo valor</label>
                <p class="bad-text" id="badNuevoValor"></p>
            </div>

            <div class="input-container" id="containerMiniModalInputNuevoValor2" >
                <input id="miniModalInput2" type="text" placeholder=" " />
                <label for="miniModalInput2" id="labelMiniModalInput2">Confirmar nuevo valor</label>
                <p class="bad-text" id="badNuevoValor2"></p>
            </div>

            <div class="input-container" id="containerMiniModalInputPass" >
                <input id="miniModalInputPass" type="password" placeholder=" " />
                <label for="miniModalInputPass" id="labelMiniModalInputPass">Nueva contraseña</label>
                <button type="button" class="toggle-password" id="showPasswordBtn" style="display: none;">
                    <span class="material-symbols-outlined" id="icon">visibility</span>
                </button>
                <p class="bad-text" id="badNuevaPass"></p>
                <div class="password-strength">
                    <div class="progress-bar"></div>
                </div>

            </div>

            <div class="input-container" id="containerMiniModalInputPass2" >
                <input id="miniModalInputPass2" type="password" placeholder=" " />
                <label for="miniModalInputPass2" id="labelMiniModalInputPass2">Confirmar contraseña</label>
                <p class="bad-text" id="badNuevaPass2"></p>

            </div>

            <div style="text-align: right;">
                <button class="mini-modal-cancel">Cancelar</button>
                <button class="mini-modal-confirm">Confirmar</button>
            </div>
            </div>
        </div>

        <!-- Mini modal para eliminar usuario -->
        <div class="mini-modal-overlay" id="deleteUserOverlay"></div>
        <div class="mini-modal" id="deleteUserModal">
            <div class="mini-modal-content">
            <h4 style="margin-bottom: 18px;">¿Estás seguro de que deseas eliminar tu cuenta?</h4>
            <p style="margin-bottom: 18px;">Esta acción es irreversible y eliminará todos tus datos.</p>
            <div style="text-align: right;">
                <button id="cancelDeleteUser" class="mini-modal-cancel">No</button>
                <button id="confirmDeleteUser" class="mini-modal-confirm" style="background: #e44;">Sí, eliminar</button>
            </div>
            </div>
        </div>

        <div class="mini-modal-overlay" id="deleteConceptoOverlay"></div>
        <div class="mini-modal" id="deleteConceptoModal">
            <div class="mini-modal-content">
            <h4 style="margin-bottom: 12px; text-align: center;" id="deleteConceptoTitle"></h4>
            <p style="margin-bottom: 18px; text-align: center;">Este concepto tiene movimientos asociados.<br>
                ¿Qué quieres hacer?</p>
            <div style="display: flex; align-items: center; flex-direction: column; gap: 10px;">
                <div>
                <button id="confirmDeleteConcepto" class="mini-modal-confirm" style="background: #e44;">Eliminar movimientos tambien</button>
                <button id="editarMovimientosConcepto" class="mini-modal-confirm" style="background: #ffa400; color:#222;">Editar movimientos</button>
                </div>
                <button id="cancelDeleteConcepto" class="mini-modal-cancel" style="margin-top: 15px">Cancelar</button>

            </div>
            </div>
        </div>

        <!-- Mini modal para editar concepto en movimientos -->
        <div class="mini-modal-overlay" id="editMovsConceptoOverlay"></div>
        <div class="mini-modal" id="editMovsConceptoModal">
        <div class="mini-modal-content">
            <h4 id="editMovsConceptoTitle"></h4>
            <div class="input-container" style="margin-bottom: 18px;">
            <div class="concepto-dropdown" id="editConceptoDropdown">
                <div class="concepto-display" id="editConceptoDisplay">Selecciona concepto</div>
                <ul class="concepto-options" id="editConceptoOptions"></ul>
            </div>
            </div>
            <div id="editMovsConceptoError" style="color: red; display: none; margin-bottom: 8px;"></div>
            <div id="editMovsConceptoDesc" style="font-size: 14px; margin-bottom: 18px;"></div>
            <div style="text-align: right;">
            <button class="mini-modal-cancel" id="cancelEditMovsConcepto">Cancelar</button>
            <button class="mini-modal-confirm" id="confirmEditMovsConcepto">Confirmar</button>
            </div>
        </div>
        </div>


        </section>
    </div>
</div>