async function renderResumen(supabase) {
    let guias = [];

    try {
        const { data, error } = await supabase
            .from('guias')
            .select('id, fecha, observaciones, fecha_et02, observaciones_et02, etapa01, etapa02')
            .order('fecha', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        guias = data || [];
    } catch (err) {
        console.error("Error en Resumen:", err);
    }

    const dateOptions = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen de Guías</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body class="resumen">
        <div class="container">
            <h2>📊 Resumen de Guías - Top 10 Recientes</h2>
            <div class="guias-list">
                ${guias.map(guia => {
                    let progress = 0;
                    let statusText = 'Pendiente';
                    let color = '#ccc';
                    
                    if (guia.etapa01) {
                        progress = 50;
                        statusText = 'Creada y Enviada';
                        color = '#ff9800';
                    }
                    if (guia.etapa02) {
                        progress = 100;
                        statusText = 'Completada';
                        color = '#4caf50';
                    }

                    return `
                    <div class="guia-item">
                        <div class="guia-header">
                            <span class="guia-id">Guía #${guia.id}</span>
                            <span class="guia-fecha">
                                ${new Date(guia.fecha).toLocaleString('es-ES', dateOptions)}
                            </span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${progress}%; background-color: ${color};"></div>
                        </div>
                        <div class="progress-text">${statusText} (${progress}%)</div>
                        
                        <div class="guia-details">
                            <p><strong>Observaciones:</strong> ${guia.observaciones || 'Sin observaciones'}</p>
                            
                            ${guia.fecha_et02 ? `
                                <p><strong>Fecha Etapa 02:</strong> 
                                    ${new Date(guia.fecha_et02).toLocaleString('es-ES', dateOptions)}
                                </p>` : ''}     
                                
                            ${guia.observaciones_et02 ? `<p><strong>Observaciones Etapa 02:</strong> ${guia.observaciones_et02}</p>` : ''}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            <a href="/" class="btn-back">← Volver al Panel Principal</a>
        </div>
    </body>
    </html>`;
}

module.exports = { renderResumen };