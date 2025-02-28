const app = require('./app');

const server = app.listen(app.get('port'), () => {
    console.log(`🚀 Servidor corriendo en https://hsimulaciones.luispincay.com:${app.get('port')}`);
});

// Manejo de cierre seguro (cuando el usuario detiene el servidor)
process.on('SIGINT', () => {
    console.log('🛑 Servidor detenido manualmente con Ctrl + C');
    server.close(() => {
        console.log('✅ Conexión cerrada correctamente.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('🛑 Servidor detenido por el sistema');
    server.close(() => {
        console.log('✅ Conexión cerrada correctamente.');
        process.exit(0);
    });
});
