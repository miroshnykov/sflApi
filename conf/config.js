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
    sflApiCache: {
        host: 'https://sfl-api-cache.surge.systems/',
    },
    recipe: {
        acProducts: '/tmp/recipe_sfl_api/acProducts.json.gz',
        affiliateProductProgram: '/tmp/recipe_sfl_api/affiliateProductProgram.json.gz',
        refCodes: '/tmp/recipe_sfl_api/refCodesData.json.gz'
    },
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
        intervalRequest: 10
    }
}

module.exports = config
