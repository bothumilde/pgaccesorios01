const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { renderEtapa01 } = require('./etapa01');
const { renderEtapa02 } = require('./etapa02');
const { renderEtapa03 } = require('./etapa03');
const { renderResumen } = require('./resumen');

const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos (CSS, JS, etc.)
app.use(express.static('.'));

// IMPORTANTE: Middleware para leer los JSON que enviamos desde el navegador
app.use(express.json());

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', async (req, res) => {
    let sqlStatus = "";
    let sqlVersion = "";

    try {
        const { data, error } = await supabase.rpc('version');
        if (error) throw error;
        sqlVersion = data;
        sqlStatus = "✅ Nexo con Supabase: OK";
    } catch (err) {
        sqlStatus = "❌ Error de conexión: " + err.message;
        sqlVersion = "No disponible";
    }

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Control de Accesorios FMC</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
        <div class="container">
            <button class="btn-etapa01" onclick="location.href='/etapa01'">ETAPA 01: CREACIÓN</button>
            <button class="btn-etapa02" onclick="location.href='/etapa02'">ETAPA 02: ENTREGA</button>
            <button class="btn-resumen" onclick="location.href='/resumen'"> BARRA DE PROGRESO</button>
        </div>
        <div class="footer-info">
            <p class="status-badge">${sqlStatus}</p>
            <p>Versión detectada: <br> ${sqlVersion}</p>
        </div>
    </body>
    </html>`);
});

// PÁGINA ETAPA 01
app.get('/etapa01', async (req, res) => {
    try {
        const html = await renderEtapa01(supabase);
        res.send(html);
    } catch (err) {
        res.status(500).send("Error al cargar Etapa 01: " + err.message);
    }
});

// PÁGINA ETAPA 02
app.get('/etapa02', async (req, res) => {
    try {
        const html = await renderEtapa02();
        res.send(html);
    } catch (err) {
        res.status(500).send("Error al cargar Etapa 02: " + err.message);
    }
});

// PÁGINA ETAPA 03 (Temporal)
app.get('/etapa03', async (req, res) => {
    try {
        const html = await renderEtapa03();
        res.send(html);
    } catch (err) {
        res.status(500).send("Error al cargar Etapa 03: " + err.message);
    }
});

// PÁGINA RESUMEN
app.get('/resumen', async (req, res) => {
    try {
        const html = await renderResumen(supabase);
        res.send(html);
    } catch (err) {
        res.status(500).send("Error al cargar Resumen: " + err.message);
    }
});

// --- 2. RUTAS DE API (PROCESAMIENTO) ---

// GUARDAR NUEVA GUÍA (ETAPA 01)
app.post('/api/guardar-guia', async (req, res) => {
    const { items, observaciones } = req.body;
    try {
        // Insertar guía principal
        const { data: guiaData, error: guiaError } = await supabase
            .from('guias')
            .insert({ 
                observaciones: observaciones || 'Sin observaciones', 
                etapa01: true 
            })
            .select('id')
            .single();
        
        if (guiaError) throw guiaError;
        
        const guiaId = guiaData.id;

        // Insertar detalles
        const detalles = items.map(item => ({
            guias_id: guiaId,
            accesorios_id: parseInt(item.id),
            cantidad: parseInt(item.cantidad)
        }));

        const { error: detalleError } = await supabase
            .from('guias_detalle')
            .insert(detalles);

        if (detalleError) throw detalleError;

        res.json({ success: true, message: "Guía #" + guiaId + " guardada con éxito." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// CONSULTAR GUÍA Y VISTA (ETAPA 02)
app.get('/api/consultar-guia/:id', async (req, res) => {
    const guiaId = req.params.id;
    try {
        // Consultar cabecera
        const { data: cabecera, error: cabError } = await supabase
            .from('guias')
            .select('fecha, observaciones, fecha_et02, etapa02, observaciones_et02, etapa03')
            .eq('id', guiaId)
            .single();

        if (cabError || !cabecera) {
            return res.json({ success: false, message: "La guía no existe." });
        }

        // Consultar detalles desde vista
        const { data: detalles, error: detError } = await supabase
            .from('vista_detalle_guia')
            .select('*')
            .eq('guias_id', guiaId);

        if (detError) throw detError;

        res.json({ success: true, cabecera, detalles: detalles || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// EJECUTAR FUNCIÓN (VALIDACIÓN ETAPA 02)
app.post('/api/validar-etapa02', async (req, res) => {
    const { guiaId, obs } = req.body;
    try {
        const { data, error } = await supabase.rpc('bnd_etapa02', {
            p_guia_id: parseInt(guiaId),
            p_observaciones: obs || ''
        });

        if (error) throw error;

        res.json({ success: true, message: data });
    } catch (err) {
        console.error("Error en validar Etapa 02:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/validar-etapa03', async (req, res) => {
    const { guiaId, obs } = req.body;
    try {
        const { data, error } = await supabase.rpc('bnd_etapa03', {
            p_guia_id: parseInt(guiaId),
            p_observaciones: obs || ''
        });

        if (error) throw error;

        res.json({ success: true, message: data });
    } catch (err) {
        console.error("Error en validar Etapa 03:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- 3. INICIO ---
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
