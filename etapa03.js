async function renderEtapa03() {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etapa 03 - Entrega de Guía</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body class="etapa03">
        <div class="container">
            <h2>📦 Entrega de Accesorios - Etapa 03</h2>
            
            <div class="search-section">
                <input type="number" id="inputGuiaId" placeholder="ID de la Guía para ENTREGA..." min="1">
                <button class="btn-search" onclick="consultarGuia()">BUSCAR</button>
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
                
                <label for="txtObservaciones">Observaciones de Entrega:</label>
                <textarea id="txtObservaciones" rows="3" placeholder="Notas sobre el despacho o entrega final..."></textarea>
                
                <button id="btnValidar" class="btn-validar" onclick="ejecutarValidacion()">
                    👍📝 FINALIZAR ENTREGA
                </button>
            </div>

            <a href="/" class="back-link">← Volver al Panel Principal</a>
        </div>

        <script>
            async function consultarGuia() {
                const id = document.getElementById('inputGuiaId').value;
                if (!id) return alert("Ingrese un ID");

                try {
                    const response = await fetch('/api/consultar-guia/' + id);
                    const data = await response.json();

                    if (!data.success) {
                        alert(data.message);
                        resetVista();
                        return;
                    }

                    // --- CANDADO 1: ¿Pasó por Etapa 02? ---
                    if (!data.cabecera.etapa02) {
                        alert("🛑 No se puede entregar. Esta guía NO ha sido validada en la Etapa 02.");
                        resetVista();
                        return;
                    }

                    // --- CANDADO 2: ¿Ya se entregó (Etapa 03)? ---
                    if (data.cabecera.etapa03) {
                        alert("⚠️ Esta guía ya fue entregada anteriormente (Etapa 03 finalizada).");
                        resetVista();
                        const infoDiv = document.getElementById('infoGuia');
                        infoDiv.style.display = 'block';
                        infoDiv.innerHTML = \`<strong>ESTADO:</strong> ✅ ENTREGA COMPLETADA\`;
                        return;
                    }

                    // Si pasa los candados, mostramos datos
                    const infoDiv = document.getElementById('infoGuia');
                    infoDiv.style.display = 'block';
                    infoDiv.innerHTML = \`
                        <strong>Fecha Creación:</strong> \${new Date(data.cabecera.fecha).toLocaleString()}<br>
                        <strong>Obs. Etapa 02:</strong> \${data.cabecera.observaciones_et02 || 'Sin observaciones'}
                    \`;

                    const cuerpo = document.getElementById('cuerpoDetalles');
                    cuerpo.innerHTML = '';
                    data.detalles.forEach(d => {
                        cuerpo.innerHTML += \`<tr>
                            <td>\${d.accesorio_nombre}</td>
                            <td>\${d.area_nombre}</td>
                            <td><strong>\${d.cantidad}</strong></td>
                        </tr>\`;
                    });

                    document.getElementById('tablaDetalles').style.display = 'table';
                    document.getElementById('resultadoBusqueda').style.display = 'block';

                } catch (err) {
                    alert("Error: " + err.message);
                }
            }

            async function ejecutarValidacion() {
                const id = document.getElementById('inputGuiaId').value;
                const obsValue = document.getElementById('txtObservaciones').value;
                
                if (!confirm("¿Confirmar entrega final para la Guía #" + id + "?")) return;
            
                try {
                    const response = await fetch('/api/validar-etapa03', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ guiaId: id, obs: obsValue })
                    });
            
                    const res = await response.json();
                    if (res.success) {
                        alert(res.message);
                        location.href = '/';
                    } else {
                        alert("Error: " + res.error);
                    }
                } catch (err) {
                    alert("Error de red.");
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

module.exports = { renderEtapa03 };