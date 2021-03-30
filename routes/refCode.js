const config = require('plain-config')()
const {catchHandler} = require('../middlewares/catchErr')
const {refCode} = require('../db/refCodeInfo')
const {getDataCache, setDataCache} = require('../cache/redis')
const metrics = require('../lib/metrics')
const {rangeTime} = require('../lib/utils')

const {performance} = require('perf_hooks')

let recipeData = {
    getRefCodeInfo: async (req, res, next) => {
        try {
            let startTimeSegmentProcessing = performance.now()
            let timeSegmentProcessing

            let inputData = {}
            let inputRefCode = req.query.ref && Number(req.query.ref) || 0
            let inputProd = req.query.prod && Number(req.query.prod) || 0

            inputData.ref = inputRefCode
            inputData.prodId = inputProd
            let redisKey = `${inputRefCode}-${inputProd}`
            let cacheData = await getDataCache(redisKey)
            let response
            // if (cacheData) {
            //     response = cacheData
            //     metrics.influxdb(200, `getRefCodeFromRedis`)
            // } else {
                response = await refCode(inputData)

                if (response) {

                    timeSegmentProcessing = performance.now()
                    let totalTime = timeSegmentProcessing - startTimeSegmentProcessing
                    // if (rangeTime(totalTime) > 50) {
                    let timeSpeed =rangeTime(totalTime)
                    console.log('rangeTime:',timeSpeed)
                    metrics.influxdb(200, `Speed-${timeSpeed}`)
                    // }

                    await setDataCache(redisKey, response)
                    metrics.influxdb(200, `setDataToCache`)

                }
            // }



            res.send(response)

        } catch (e) {
            catchHandler(e, 'getRefCodeInfoErr')
            console.log('getRefCodeInfoError:', e)
            metrics.influxdb(500, `getRefCodeInfoError`)
            next(e)
        }
    }
}

module.exports = recipeData