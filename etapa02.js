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
                <input type="number" id="inputGuiaId" placeholder="Ingrese el ID de la Guía a validar..." min="1">
                <button id="btnBuscar" class="btn-search" onclick="consultarGuia()">BUSCAR</button>
            </div>

            <div id="infoGuia" class="header-info"></div>

            <div id="resultadoBusqueda">
                <table id="tablaDetalles">
                    <thead>
                        <tr>
                            <th>Accesorio</th>
                            <th>Área</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody id="cuerpoDetalles"></tbody>
                </table>

                <label for="txtObservaciones">Observaciones (Opcional):</label>
                <textarea id="txtObservaciones" rows="3" maxlength="1000" placeholder="Escriba aquí notas adicionales sobre esta validación..."></textarea>

                <button id="btnValidar" class="btn-validar" onclick="ejecutarValidacion()">
                    ✅ VALIDAR Y ENTREGAR
                </button>
            </div>

            <a href="/" class="back-link">← Volver al Panel Principal</a>
        </div>
        <div id="loading-overlay">Cargando...</div>

        <script>
            function showLoading() {
                document.getElementById('loading-overlay').style.display = 'flex';
                document.body.classList.add('loading');
                document.getElementById('btnBuscar').disabled = true;
                document.getElementById('btnValidar').disabled = true;
            }

            function hideLoading() {
                document.getElementById('loading-overlay').style.display = 'none';
                document.body.classList.remove('loading');
                document.getElementById('btnBuscar').disabled = false;
                document.getElementById('btnValidar').disabled = false;
            }

            async function consultarGuia() {
                const id = document.getElementById('inputGuiaId').value;
                if (!id) return alert("Por favor, ingrese un número de guía.");

                showLoading();

                try {
                    const response = await fetch('/api/consultar-guia/' + id);
                    const data = await response.json();

                    if (!data.success) {
                        alert(data.message);
                        resetVista();
                        return;
                    }

                    if (data.cabecera.etapa02) {
                        alert("⚠️ Esta guía ya ha sido ENTREGADA anteriormente.");

                        const infoDiv = document.getElementById('infoGuia');
                        infoDiv.style.display = 'block';
                        infoDiv.style.background = '#ffeb3b';
                        // Usamos backslash \ antes de las comillas invertidas y el símbolo de pesos
                        infoDiv.innerHTML = \`<strong>ESTADO:</strong> ✅ ENTREGA EXITOSA <br>
                                             <strong>Observaciones:</strong> \${data.cabecera.observaciones || 'Sin observaciones'}\`;
                    } else {
                        // 1. Mostrar cabecera
                        const infoDiv = document.getElementById('infoGuia');
                        infoDiv.style.display = 'block';
                        infoDiv.innerHTML = \`
                            <strong>Fecha de Creación:</strong> \${new Date(data.cabecera.fecha).toLocaleString()}<br>
                            <strong>Observaciones Iniciales:</strong> \${data.cabecera.observaciones || 'Sin observaciones'}
                        \`;
                    }

                    // 2. Llenar tabla
                    const cuerpo = document.getElementById('cuerpoDetalles');
                    cuerpo.innerHTML = '';
                    data.detalles.forEach(d => {
                        cuerpo.innerHTML += \`
                            <tr>
                                <td>\${d.accesorio_nombre}</td>
                                <td>\${d.area_nombre}</td>
                                <td><strong>\${d.cantidad}</strong></td>
                            </tr>
                        \`;
                    });

                    // 3. Mostrar tabla
                    document.getElementById('tablaDetalles').style.display = 'table';
                    document.getElementById('resultadoBusqueda').style.display = 'block';

                    // 4. Ocultar observaciones y botón si ya está entregada
                    if (data.cabecera.etapa02) {
                        document.querySelector('label[for="txtObservaciones"]').style.display = 'none';
                        document.getElementById('txtObservaciones').style.display = 'none';
                        document.getElementById('btnValidar').style.display = 'none';
                    } else {
                        document.querySelector('label[for="txtObservaciones"]').style.display = 'block';
                        document.getElementById('txtObservaciones').style.display = 'block';
                        document.getElementById('btnValidar').style.display = 'block';
                    }

                } catch (err) {
                    alert("Error en la consulta: " + err.message);
                } finally {
                    hideLoading();
                }
            }

            async function ejecutarValidacion() {
                const id = document.getElementById('inputGuiaId').value;
                const obsValue = document.getElementById('txtObservaciones').value;

                if (!confirm("¿Desea registrar la ENTREGA la Guía #" + id + "?")) return;

                showLoading();

                try {
                    const response = await fetch('/api/validar-etapa02', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            guiaId: id,
                            obs: obsValue
                        })
                    });

                    const res = await response.json();
                    if (res.success) {
                        alert(res.message);
                        location.href = '/';
                    } else {
                        alert("Error al validar: " + res.error);
                    }
                } catch (err) {
                    alert("Error de red al validar.");
                } finally {
                    hideLoading();
                }
            }

            function resetVista() {
                document.getElementById('infoGuia').style.display = 'none';
                document.getElementById('resultadoBusqueda').style.display = 'none';
                document.getElementById('txtObservaciones').value = '';
            }
        </script>
    </body>
    </html>`;
}

module.exports = { renderEtapa02 };