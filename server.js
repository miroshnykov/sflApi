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
const {getDataCache, setDataCache, getKeysCache} = require('./cache/redis')

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

    socket.on('filesSizeRefCodes', async (fileSizeInfo) => {

        try {

            let fileSizeInfoOld = await getDataCache('filesSizeRefCodes_')
            if (!fileSizeInfoOld) {
                socket.emit('sendingAffiliateProductProgram')
                socket.emit('sendingAcProducts')
                socket.emit('sendingRefCodes')
                await setDataCache('filesSizeRefCodes_', fileSizeInfo)
                logger.info(`Set to redis fileSizeInfo,${JSON.stringify(fileSizeInfo)}`)
                metrics.influxdb(200, `fileSizeInfoDifferent-${computerName}`)
                return
            }
            if (fileSizeInfoOld.acProductsData !== fileSizeInfo.acProductsData) {
                logger.info(`!!!! FileSizeInfo change acProductsData,  OLD size: ${fileSizeInfoOld.acProductsData}, NEW size ${fileSizeInfo.acProductsData}`)
                metrics.influxdb(200, `fileSizeInfoAcProductsDifferent-${computerName}`)
                socket.emit('sendingAcProducts')
            }

            if (fileSizeInfoOld.affiliateProductProgram !== fileSizeInfo.affiliateProductProgram) {
                logger.info(`!!!! FileSizeInfo change affiliateProductProgram, OLD size: ${fileSizeInfoOld.affiliateProductProgram}, NEW size ${fileSizeInfo.affiliateProductProgram}`)
                metrics.influxdb(200, `fileSizeInfoAffiliateProductProgramDifferent-${computerName}`)
                socket.emit('sendingAffiliateProductProgram')
            }

            if (fileSizeInfoOld.refCodesData !== fileSizeInfo.refCodesData) {
                logger.info(`!!!! FileSizeInfo change refCodesData, OLD size: ${fileSizeInfoOld.refCodesData}, NEW size ${fileSizeInfo.refCodesData}`)
                metrics.influxdb(200, `fileSizeInfoRefCodesDataDifferent-${computerName}`)
                socket.emit('sendFileAffiliates')
            }

            await setDataCache('filesSizeRefCodes_', fileSizeInfo)
        } catch (e) {
            logger.error(`fileSizeInfoError:`, e)
            metrics.influxdb(500, `fileSizeInfoError-${computerName}`)
        }


    })

    const cronFileSizeInfo = async () => {
        try {
            let fileSizeInfo = await getDataCache('filesSizeRefCodes_') || []
            console.log(` *** checking filesSizeRefCodes_ data:${JSON.stringify(fileSizeInfo)}`)
            socket.emit('filesSizeRefCodes', fileSizeInfo)
        } catch (e) {
            logger.error(`cronFileSizeInfoError:`, e)
        }

    }

    setInterval(cronFileSizeInfo, 600000) // 600000 -> 10min
    // setTimeout(cronFileSizeInfo, 45000) // 45 sec, at application start


    ss(socket).on('sendingAffiliateProductProgram', (stream) => {
        console.log('Got affiliateProductProgramFile:', affiliateProductProgramFile)
        stream.pipe(fs.createWriteStream(affiliateProductProgramFile))
        stream.on('end', () => {
            setTimeout(async () => {
                if (config.env === 'development') return
                try {
                    logger.info(` *** set Redis AffiliateProductProgram`)
                    await setAffiliateProductProgram()
                    metrics.influxdb(200, `setRedisAffiliateProductProgram-${computerName}`)
                } catch (e) {
                    logger.error(`setRedisAffiliateProductProgramError:`, e)
                    metrics.influxdb(500, `setRedisAffiliateProductProgramError-${computerName}`)
                }

            }, 60000) // 60000 1m

        })
    })

    ss(socket).on('sendingAcProducts', (stream) => {
        console.log('Got acProductsFile:', acProductsFile)
        stream.pipe(fs.createWriteStream(acProductsFile))
        stream.on('end', () => {
            setTimeout(async () => {
                if (config.env === 'development') return
                try {
                    logger.info(` *** set Redis AcProducts`)
                    await setAcProducts()
                    metrics.influxdb(200, `setRedisAcProducts-${computerName}`)
                } catch (e) {
                    logger.error(`setRedisAcProductsError:`, e)
                    metrics.influxdb(500, `setRedisAcProductsError-${computerName}`)
                }

            }, 180000) // 3m 180000

        })
    })

    ss(socket).on('sendingRefCodes', (stream) => {
        console.log('Got refCodesFile:', refCodesFile)
        stream.pipe(fs.createWriteStream(refCodesFile))
        stream.on('end', () => {
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

            }, 120000) // 2m 120000

        })
    })

    const getRecipeFromSflApiCache = async () => {
        if (config.env === 'development') return
        try {
            logger.info(' *** getRecipeFromSflApiCache get recipe file from sfl-api-cache')
            socket.emit('sendingAffiliateProductProgram')
            socket.emit('sendingAcProducts')
            socket.emit('sendingRefCodes')
        } catch (e) {
            logger.error(`emitSendFileOneTimeError:`, e)
            metrics.influxdb(500, `emitSendFileOneTimeError`)
        }
    }
    //
    // setInterval(getRecipeFromSflApiCache, 3600000) // 3600000 -> 60 min
    setTimeout(getRecipeFromSflApiCache, 25000) // 25000 -> 25 sec

    const {getFileSize} = require('./lib/utils')
    const checkFileSizeWithRedisSizeInfo = async () => {

        console.log(' **** CheckFileSizeWithRedisSizeInfo:')
        try {
            let fileSizeInfoRedis = await getDataCache('filesSizeRefCodes_')

            let affiliateProductProgramfile = config.recipe.affiliateProductProgram
            let acProducts = config.recipe.acProducts
            let refCodes = config.recipe.refCodes
            let affiliateProductProgramSize = await getFileSize(affiliateProductProgramfile)
            let acProductsSize = await getFileSize(acProducts)
            let refCodesSize = await getFileSize(refCodes)

            if (fileSizeInfoRedis.refCodesData !== refCodesSize) {
                console.log('refCode not the same , will get new recipe file')
                socket.emit('sendingRefCodes')
            }
            if (fileSizeInfoRedis.affiliateProductProgram !== affiliateProductProgramSize) {
                console.log('affiliateProductProgram not the same , will get new recipe file')
                socket.emit('sendingAffiliateProductProgram')

            }
            if (fileSizeInfoRedis.acProductsData !== acProductsSize) {
                console.log('acProductsSize not the same , will get new recipe file')
                socket.emit('sendingAcProducts')
            }
        } catch (e) {
            console.log('checkFileSizeWithRedisSizeInfo', e)
        }

    }

    setInterval(checkFileSizeWithRedisSizeInfo, 2586000) // 2586000 -> 43.1 min
    // setTimeout(checkFileSizeWithRedisSizeInfo, 45000) // 45000 -> 45 sec

    const checkEmptyRedisData = async () => {
        try {

            let affiliateProductProgramRedisCount = await getKeysCache('affiliateProductProgram*')
            let acProductRedisCount = await getKeysCache('acProduct*')
            let refCodeCount = await getKeysCache('refCode*')
            if (affiliateProductProgramRedisCount.length === 0) {
                console.log('run set affiliateProductProgramRedisCount')
                metrics.influxdb(200, `forceSetRedisAffiliateProductProgram`)
                await setAffiliateProductProgram()
            }
            if (acProductRedisCount.length === 0) {
                console.log('run set acProductRedisCount')
                metrics.influxdb(200, `forceSetRedisAcProduct`)
                await setAcProducts()
            }

            if (refCodeCount.length === 0) {
                console.log('run set acProductRedisCount')
                metrics.influxdb(200, `forceSetRedisRefCodes`)
                await setRefCodesFile()
            }
        } catch (e) {
            logger.error(`checkEmptyRedisDataError:`, e)
        }

    }

    setInterval(checkEmptyRedisData, 200000) // 200000 -> 3.3 min

} else {
    require('./worker')
}

