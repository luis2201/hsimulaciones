const app = require('./app');

app.listen(app.get('port'), () => {
    console.log("Servidor escuchado en el puerto", app.get("port"));
});