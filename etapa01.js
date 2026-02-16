async function renderEtapa01(supabase) {
    let proximoId = 1;
    let listaAccesorios = [];
    let listaAreas = [];

    try {
        // Obtener próximo ID
        const { data: resId, error: errId } = await supabase
            .from('guias')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        
        if (errId) throw errId;
        proximoId = (resId && resId.length > 0) ? resId[0].id + 1 : 1;

        // Obtener áreas
        const { data: resAreas, error: errAreas } = await supabase
            .from('area')
            .select('id, nombre')
            .order('nombre');
        
        if (errAreas) throw errAreas;
        listaAreas = resAreas || [];

        // Obtener accesorios con JOIN a área
        const { data: resAcc, error: errAcc } = await supabase
            .from('accesorios')
            .select(`
                id,
                nombre,
                area:id_area (
                    id,
                    nombre
                )
            `);
        
        if (errAcc) throw errAcc;
        
        // Mapear al formato esperado por el HTML
        listaAccesorios = (resAcc || []).map(a => ({
            et01_id: a.id,
            et01_nombre: a.nombre,
            et01_area_id: a.area?.id || a.id_area,
            et01_area: a.area?.nombre || 'Sin área'
        }));

        console.log("Datos recibidos de Supabase:", listaAccesorios[0]);

    } catch (err) {
        console.error("Error en Etapa 01:", err);
    }

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etapa 01 - Registro de Guía</title>
        <link rel="stylesheet" href="styles.css">
        <style>
            #loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            body.loading {
                overflow: hidden;
            }
        </style>
    </head>
    <body class="etapa01">
        <div class="container">
            <h2>🚚👈 Nueva Guía - Etapa 01</h2>

            <div class="section">
                <label>ID de Guía: ${proximoId}</label>
            </div>

            <div class="section">
                <label>Seleccionar accesorios</label>
                <div class="search-box">
                    <select id="selectorArea">
                        <option value="">-- Todas las áreas --</option>
                        ${listaAreas.map(area => `
                            <option value="${area.id}">${area.nombre}</option>
                        `).join('')}
                    </select>
                    <select id="selectorAccesorios">
                        <option value="">-- Seleccione un item --</option>
                        ${listaAccesorios.map(acc => `
                            <option value="${acc.et01_id}"
                                    data-nombre="${acc.et01_nombre.replace(/"/g, '"')}"
                                    data-area="${acc.et01_area.replace(/"/g, '"')}"
                                    data-area-id="${acc.et01_area_id}">
                                ${acc.et01_id} | ${acc.et01_nombre} | Área: ${acc.et01_area}
                            </option>
                        `).join('')}
                    </select>
                    <button class="add-btn" onclick="agregarAlCarrito()">+ Añadir</button>
                </div>
            </div>

            <div class="section">
                <label>Carrito de accesorios</label>
                <div id="carritoBody" class="carrito-list"></div>
            </div>

            <div class="section">
                    <label>Observaciones (Opcional)</label>
                    <textarea id="txtObservaciones" rows="3" maxlength="1000" placeholder="Escriba aquí notas adicionales..."></textarea>
            </div>

            <button id="btnProcesar" class="btn-validar" onclick="procesarGuardado()">
            💾 FINALIZAR Y CREAR GUÍA
            </button>

            <a href="/" class="btn-back">← Volver al Panel Principal</a>
        </div>
        <div id="loading-overlay">Cargando...</div>
        <script>
            function showLoading() {
                document.getElementById('loading-overlay').style.display = 'flex';
                document.body.classList.add('loading');
                document.getElementById('btnProcesar').disabled = true;
            }

            function hideLoading() {
                document.getElementById('loading-overlay').style.display = 'none';
                document.body.classList.remove('loading');
                document.getElementById('btnProcesar').disabled = false;
            }

            // Lista completa de accesorios para filtrado
            const todosLosAccesorios = Array.from(document.querySelectorAll('#selectorAccesorios option')).filter(opt => opt.value);

            // Función para filtrar accesorios por área
            function filtrarAccesorios() {
                const areaSeleccionada = document.getElementById('selectorArea').value;
                const selectAcc = document.getElementById('selectorAccesorios');

                // Limpiar opciones actuales
                selectAcc.innerHTML = '<option value="">-- Seleccione un item --</option>';

                // Filtrar y agregar opciones
                todosLosAccesorios.forEach(opt => {
                    if (!areaSeleccionada || opt.getAttribute('data-area-id') === areaSeleccionada) {
                        selectAcc.appendChild(opt.cloneNode(true));
                    }
                });
            }

            // Event listener para el selector de área
            document.getElementById('selectorArea').addEventListener('change', filtrarAccesorios);

            function agregarAlCarrito() {
                const select = document.getElementById('selectorAccesorios');
                const opt = select.options[select.selectedIndex];
                if (!opt.value) return;

                const carritoList = document.getElementById('carritoBody');
                const itemId = opt.value;

                // Verificar si el item ya está en el carrito
                const existingItem = carritoList.querySelector(\`[data-id="\${itemId}"]\`);
                if (existingItem) {
                    alert("Este item ya está en el carrito. No se permiten duplicados.");
                    return;
                }

                const item = document.createElement('div');
                item.className = 'carrito-item';
                // IMPORTANTE: Guardamos el ID en un atributo data-id para leerlo luego
                item.setAttribute('data-id', opt.value);
                item.innerHTML = \`
                    <div class="item-info">
                        <span class="item-nombre">\${opt.getAttribute('data-nombre')}</span>
                        <span class="item-area">\${opt.getAttribute('data-area')}</span>
                    </div>
                    <div class="item-controls">
                        <input type="number" class="qty-input" value="1" min="1">
                        <button class="remove-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
                    </div>
                \`;
                carritoList.appendChild(item);
                select.selectedIndex = 0;
            }

            async function procesarGuardado() {
                const items = document.querySelectorAll('#carritoBody .carrito-item');
                if (items.length === 0) return alert("El carrito está vacío");

                showLoading();

                // 1. Recolectar datos de la lista
                const datosParaEnviar = {
                    observaciones: document.getElementById('txtObservaciones').value,
                    items: []
                };

                items.forEach(item => {
                    datosParaEnviar.items.push({
                        id: item.getAttribute('data-id'),
                        cantidad: item.querySelector('.qty-input').value
                    });
                });

                // 2. Enviar al servidor via POST
                try {
                    const response = await fetch('/api/guardar-guia', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosParaEnviar)
                    });

                    const resultado = await response.json();
                    if (resultado.success) {
                        alert(resultado.message);
                        location.href = '/'; // Volver al inicio al terminar
                    } else {
                        alert("Error: " + resultado.message);
                    }
                } catch (error) {
                    alert("Error de conexión: " + error.message);
                } finally {
                    hideLoading();
                }
            }
        </script>
    </body>
    </html>`;
}

module.exports = { renderEtapa01 };
