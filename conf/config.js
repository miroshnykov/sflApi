let env

if (process.env.CI) {
    env = `CI`
}

let config

config = {
    env: process.env.NODE_ENV || env || `production`,
    port: 8097,
    redisLocal: {
        host: 'localhost',
        port: 6379
    },
    log: {
        name: `sfl-api`,
        streams: [{
            level: `INFO`,
            stream: process.stdout
        }]
    },
    sflEngineSecret:'',
    host: '',
    mysql: {
        host: '',
        port: 0,
        user: '',
        password: '',
        database: ''
    },
    influxdb: {
        host: 'https://influx.surge.systems/influxdb',
        project: 'sfl-api',
        intervalRequest: 100
    },
    sflApi:{
        secret = "XXX",     
        host = "https://sfl-api-stage1.surge.systems/"
    } 
}

module.exports = config
