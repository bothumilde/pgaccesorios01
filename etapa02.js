async function renderEtapa02() {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etapa 02 - Entrega de Guía</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body class="etapa02">
        <div class="container">
            <h2>📦 Entrega de Guía - Etapa 02</h2>

            <div class="search-section">
                <input type="number" id="inputGuiaId" placeholder="ID de Guía..." min="1">
                <button id="btnBuscar" class="btn-search" onclick="consultarGuia()">BUSCAR</button>
            </div>

            <div id="infoGuia" class="header-info"></div>

            <div id="resultadoBusqueda" style="display:none;">
                <table id="tablaDetalles">
                    <thead>
                        <tr>
                            <th>Accesorio</th>
                            <th>Área</th>
                            <th>Cant.</th>
                        </tr>
                    </thead>
                    <tbody id="cuerpoDetalles"></tbody>
                </table>

                <label for="txtObservaciones">Observaciones de Entrega (Opcional):</label>
                <textarea id="txtObservaciones" rows="3" maxlength="1000" placeholder="Notas sobre la validación..."></textarea>

                <button id="btnValidar" class="btn-validar" onclick="ejecutarValidacion()">
                    ✅ VALIDAR Y ENTREGAR
                </button>
            </div>

            <a href="/" class="back-link">← Volver al Panel Principal</a>
        </div>
        <div id="loading-overlay">Cargando...</div>

        <script>
            // --- CONFIGURACIÓN DE FECHA (ZONA PERÚ) ---
            const dateOptions = { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'America/Lima' 
            };

            const safeFormat = (dateStr) => {
                if (!dateStr) return '---';
                try {
                    return new Date(dateStr).toLocaleString('es-PE', dateOptions);
                } catch (e) {
                    return 'Fecha inválida';
                }
            };

            function showLoading() {
                document.getElementById('loading-overlay').style.display = 'flex';
                document.getElementById('btnBuscar').disabled = true;
            }

            function hideLoading() {
                document.getElementById('loading-overlay').style.display = 'none';
                document.getElementById('btnBuscar').disabled = false;
            }

            async function consultarGuia() {
                const id = document.getElementById('inputGuiaId').value;
                if (!id) return alert("Ingrese un número de guía.");

                showLoading();

                try {
                    const response = await fetch('/api/consultar-guia/' + id);
                    const data = await response.json();

                    if (!data.success) {
                        alert(data.message);
                        resetVista();
                        return;
                    }

                    const infoDiv = document.getElementById('infoGuia');
                    infoDiv.style.display = 'block';

                    if (data.cabecera.etapa02) {
                        infoDiv.style.background = '#fff3cd'; // Color de advertencia suave
                        infoDiv.innerHTML = \`
                            <div style="color: #856404; font-weight: bold; margin-bottom: 5px;">⚠️ ESTA GUÍA YA FUE ENTREGADA</div>
                            <strong>Fecha Creación:</strong> \${safeFormat(data.cabecera.fecha)}<br>
                            <strong>Fecha Entrega:</strong> \${safeFormat(data.cabecera.fecha_et02)}<br>
                            <strong>Obs. Entrega:</strong> \${data.cabecera.observaciones_et02 || 'Sin observaciones'}
                        \`;
                        ocultarControlesEntrega(true);
                    } else {
                        infoDiv.style.background = '#f8f9fa';
                        infoDiv.innerHTML = \`
                            <strong>Fecha de Creación:</strong> \${safeFormat(data.cabecera.fecha)}<br>
                            <strong>Observaciones Iniciales:</strong> \${data.cabecera.observaciones || 'Sin observaciones'}
                        \`;
                        ocultarControlesEntrega(false);
                    }

                    // Llenar tabla de detalles
                    const cuerpo = document.getElementById('cuerpoDetalles');
                    cuerpo.innerHTML = data.detalles.map(d => \`
                        <tr>
                            <td>\${d.accesorio_nombre}</td>
                            <td>\${d.area_nombre}</td>
                            <td><strong>\${d.cantidad}</strong></td>
                        </tr>
                    \`).join('');

                    document.getElementById('resultadoBusqueda').style.display = 'block';

                } catch (err) {
                    alert("Error en la consulta: " + err.message);
                } finally {
                    hideLoading();
                }
            }

            function ocultarControlesEntrega(yaEntregada) {
                const displayValue = yaEntregada ? 'none' : 'block';
                document.querySelector('label[for="txtObservaciones"]').style.display = displayValue;
                document.getElementById('txtObservaciones').style.display = displayValue;
                document.getElementById('btnValidar').style.display = displayValue;
            }

            async function ejecutarValidacion() {
                const id = document.getElementById('inputGuiaId').value;
                const obsValue = document.getElementById('txtObservaciones').value;

                if (!confirm("¿Desea registrar la ENTREGA de la Guía #" + id + "?")) return;

                showLoading();
                try {
                    const response = await fetch('/api/validar-etapa02', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ guiaId: id, obs: obsValue })
                    });

                    const res = await response.json();
                    if (res.success) {
                        alert("✅ Guía entregada con éxito.");
                        location.href = '/';
                    } else {
                        alert("Error: " + res.error);
                    }
                } catch (err) {
                    alert("Error de red.");
                } finally {
                    hideLoading();
                }
            }

            function resetVista() {
                document.getElementById('infoGuia').style.display = 'none';
                document.getElementById('resultadoBusqueda').style.display = 'none';
            }
        </script>
    </body>
    </html>`;
}

module.exports = { renderEtapa02 };