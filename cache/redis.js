const config = require('plain-config')()
const {catchHandler} = require('../middlewares/catchErr')

const asyncRedis = require('async-redis')
const redisClient = asyncRedis.createClient(config.redisLocal.port, config.redisLocal.host)

const logger = require('bunyan-loader')(config.log).child({scope: 'redis.js'})

redisClient.on('connect', () => {
    // console.log(`\x1b[36m  Redis connected to host localhost port ${config.redisLocal.port} \x1b[0m`)
    logger.info(` *** Redis connected to host localhost port:${config.redisLocal.port} } `)
})

redisClient.on('error', (err) => {
    // console.log('\x1b[41m Redis error: ' + err + '\x1b[0m')
    logger.error('Redis error:', err)
})

const setRedis = async (key, value) => (await redisClient.set(key, value, "EX", 3600)) //3600s ->  60m

const getRedis = async (value) => (await redisClient.get(value))

const setDataCache = async (key, data) => {

    try {
        await setRedis(key, JSON.stringify(data))
        // console.log(`*** Redis SET { ${key} } \n`)

    } catch (e) {
        catchHandler(e, 'setDataCache')
    }
}

const getDataCache = async (key) => {

    try {

        return JSON.parse(await getRedis(key))

    } catch (e) {
        catchHandler(e, 'getDataCache')
    }
}

module.exports = {
    getDataCache,
    setDataCache
}