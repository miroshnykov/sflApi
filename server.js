const config = require('plain-config')();
const logger = require('bunyan-loader')(config.log).child({scope: 'server.js'})
const cluster = require('cluster');
const numCores = config.cores || require('os').cpus().length;
const hostname = require('os').hostname();
const metrics = require('./lib/metrics')
let affiliateProductProgramFile = config.recipe.affiliateProductProgram
let acProductsFile = config.recipe.acProducts
let refCodesFile = config.recipe.refCodes
const os = require('os')
const computerName = os.hostname()
const {
    setAffiliateProductProgram,
    setAcProducts,
    setRefCodesFile
} = require('./cache/setData')

if (cluster.isMaster) {

    // let host = 'https://sfl-offers.surge.systems/'
    // let host = 'http://0.0.0.0:8092'

    const socket = require('socket.io-client')(config.sflApiCache.host)
    const ss = require('socket.io-stream')
    const fs = require('fs')


    logger.info(`Master pid:${process.pid} is running`);
    logger.info(`Using node ${process.version} in mode ${config.env} spawning ${numCores} processes, port ${config.port}`)


    for (let i = 0; i < numCores; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.info(`worker ${worker.process.pid} died`);
    });

    cluster.on('message', (worker, msg, handle) => {
    })

    socket.on('connect', () => {
        logger.info(` *** socket connected, host:${config.sflApiCache.host}`)
    });

    socket.on('error', (e) => {
        logger.info(` *** some errors, host:${config.sflApiCache.host}`, e)
        metrics.influxdb(500, `sflApiSocketError`)
    });

    socket.on('connect_error', (e) => {
        logger.info(` *** connect_error, host:${config.sflApiCache.host}`, e)
        metrics.influxdb(500, `sflApiConnectError`)
    })

    ss(socket).on('sendingAffiliateProductProgram', (stream) => {
        stream.pipe(fs.createWriteStream(affiliateProductProgramFile))
        stream.on('end', () => {
            // let size = getFileSize(campaignsFile) || 0
            // logger.info(`campaigns file received, ${campaignsFile}, size:${size}`)
            // metrics.influxdb(200, `fileReceivedCampaigns-size-${size}`)
            setTimeout(async () => {
                if (config.env === 'development') return
                try {
                    logger.info(` *** set Redis AffiliateProductProgram`)
                    await setAffiliateProductProgram()
                    metrics.influxdb(200, `setRedisCampaigns-${computerName}`)
                } catch (e) {
                    logger.error(`setRedisCampaignsError:`, e)
                    metrics.influxdb(500, `setRedisCampaignsError-${computerName}`)
                }

            }, 40000) // 40 sec

        })
    })

    ss(socket).on('sendingAcProducts', (stream) => {
        stream.pipe(fs.createWriteStream(acProductsFile))
        stream.on('end', () => {
            // let size = getFileSize(campaignsFile) || 0
            // logger.info(`campaigns file received, ${campaignsFile}, size:${size}`)
            // metrics.influxdb(200, `fileReceivedCampaigns-size-${size}`)
            setTimeout(async () => {
                if (config.env === 'development') return
                try {
                    logger.info(` *** set Redis AcProducts`)
                    await setAcProducts()
                    metrics.influxdb(200, `setRedisAcProducts-${computerName}`)
                } catch (e) {
                    logger.error(`setRedisCampaignsError:`, e)
                    metrics.influxdb(500, `setRedisAcProductsError-${computerName}`)
                }

            }, 30000) // 30 sec

        })
    })

    ss(socket).on('sendingRefCodes', (stream) => {
        stream.pipe(fs.createWriteStream(refCodesFile))
        stream.on('end', () => {
            // let size = getFileSize(campaignsFile) || 0
            // logger.info(`campaigns file received, ${campaignsFile}, size:${size}`)
            // metrics.influxdb(200, `fileReceivedCampaigns-size-${size}`)
            setTimeout(async () => {
                if (config.env === 'development') return
                try {
                    logger.info(` *** set Redis RefCodes`)
                    await setRefCodesFile()
                    metrics.influxdb(200, `setRedisRefCodes-${computerName}`)
                } catch (e) {
                    logger.error(`setRedisRefCodesError:`, e)
                    metrics.influxdb(500, `setRedisRefCodesError-${computerName}`)
                }

            }, 9000) // 40 sec

        })
    })

    const getRecipeFromSflApiCache = async ()=>{
        if (config.env === 'development') return
        try {
            logger.info('get recipe file from sfl-api-cache')
            socket.emit('sendingAffiliateProductProgram')
            socket.emit('sendingAcProducts')
            socket.emit('sendingRefCodes')
        } catch (e) {
            logger.error(`emitSendFileOneTimeError:`, e)
            metrics.influxdb(500, `emitSendFileOneTimeError`)
        }
    }

    setInterval(getRecipeFromSflApiCache, 1800000) // 1800000 -> 30 min
    setTimeout(getRecipeFromSflApiCache, 45000) // 45000 -> 45 sec



} else {
    require('./worker')
}

