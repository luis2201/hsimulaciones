require('dotenv').config();

module.exports = {
    app: {
        port: process.env.PORT || 4000
    },
    mysql: {
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER || "hsimulacion",
        password: process.env.MYSQL_PASSWORD || "#hosp1?4l;",
        database: process.env.MYSQL_DB || "hsimulacion"
    }
}