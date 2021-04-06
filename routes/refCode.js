const config = require('plain-config')()
const {catchHandler} = require('../middlewares/catchErr')
// const {refCode} = require('../db/refCodeInfo')
const {refCode} = require('../db/refCodeInfoPool')
const {getDataCache, setDataCache} = require('../cache/redis')
const metrics = require('../lib/metrics')
const {rangeTime} = require('../lib/utils')

const {performance} = require('perf_hooks')

// http://localhost:8097/refcode?ref=5204378&prod=1&debugging=debugging
// https://sfl-api-stage1.surge.systems/refcode?ref=5204378&prod=1&debugging=debugging

// https://sfl-api.surge.systems/refcode?ref=5204378&prod=1&debugging=debugging

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

            // console.log('inputData:',inputData)
            let redisKey = `${inputRefCode}-${inputProd}`
            let cacheData = await getDataCache(redisKey)
            if (cacheData) {
                console.log(` *** GET RefCodeProgram from cacheData:${JSON.stringify(cacheData)}`)
                timeSegmentProcessing = performance.now()
                let totalTime = timeSegmentProcessing - startTimeSegmentProcessing
                let timeSpeed = rangeTime(totalTime)
                metrics.influxdb(200, `Speed-Cache-${timeSpeed}`)
                metrics.influxdb(200, `refCodeFromCache`)
                res.send(cacheData)
                return
            }

            let clusterCacheResult = await checkClusterCache(inputData)
            if (clusterCacheResult) {
                console.log(` *** GET RefCodeProgram  from cacheCluster:${JSON.stringify(clusterCacheResult)}`)
                timeSegmentProcessing = performance.now()
                let totalTime = timeSegmentProcessing - startTimeSegmentProcessing
                let timeSpeed = rangeTime(totalTime)
                metrics.influxdb(200, `Speed-Cache-Cluster-${timeSpeed}`)
                metrics.influxdb(200, `refCodeFromCacheCluster`)
                res.send(clusterCacheResult)
                return
            }

            let refCodeDb = await refCode(inputData)

            if (refCodeDb) {
                console.log(` GET from database:${JSON.stringify(refCodeDb)}`)
                timeSegmentProcessing = performance.now()
                let totalTime = timeSegmentProcessing - startTimeSegmentProcessing
                let timeSpeed = rangeTime(totalTime)
                metrics.influxdb(200, `Speed-DB-${timeSpeed}`)
                metrics.influxdb(200, `refCodeFromDatabase`)
                await setDataCache(redisKey, refCodeDb)
                metrics.influxdb(200, `setDataToCache`)
                res.send(refCodeDb)
            }


        } catch (e) {
            catchHandler(e, 'getRefCodeInfoErr')
            console.log('getRefCodeInfoError:', e)
            metrics.influxdb(500, `getRefCodeInfoError`)
            next(e)
        }
    }
}

const checkClusterCache = async (inputData) => {
    try {
        let refCodeClusterKey = `refCode-${inputData.ref}`

        let refCodeClusterObj = await getDataCache(refCodeClusterKey)
        // console.log('Redis Cluster refCodeCluster:', refCodeClusterObj)

        if (!refCodeClusterObj) return

        const {affiliateId} = refCodeClusterObj
        let productId = inputData.prodId
        let affiliateProductProgramClusterKey = `affiliateProductPrograms-${affiliateId}-${productId}`
        // console.log('affiliateProductProgramClusterKey:',affiliateProductProgramClusterKey)
        let affiliateProductProgramCluster = await getDataCache(affiliateProductProgramClusterKey)

        // console.log('Redis Cluster affiliateProductProgramCluster:', affiliateProductProgramCluster)

        let acProductClusterKey = `acProduct-${productId}`
        let acProductCluster = await getDataCache(acProductClusterKey)
        if (!acProductCluster) return
        const {programId, productName, id} = acProductCluster


        if (affiliateProductProgramCluster) {
            const {affiliateProductProgramId} = affiliateProductProgramCluster
            refCodeClusterObj.programId = affiliateProductProgramId
            refCodeClusterObj.productName = productName
            refCodeClusterObj.productId = id || 0
            return reformatRefCodeData(refCodeClusterObj)
        } else {
            // console.log('acProductCluster:', acProductCluster)
            if (!acProductCluster) {
                console.log('acProductCluster does not exists in redisCluster')
                return
            }

            refCodeClusterObj.programId = programId
            refCodeClusterObj.productName = productName
            refCodeClusterObj.productId = id || 0
            // console.log('Redis Cluster acProductClusterObj:', refCodeClusterObj)
            return reformatRefCodeData(refCodeClusterObj)
        }

    } catch (e) {
        console.error('checkClusterCacheError:', e)
    }

}

const reformatRefCodeData = (refCodeClusterObj) => {

    try {
        // console.log(refCodeClusterObj)
        refCodeClusterObj.programId = refCodeClusterObj.programId.toString()
        refCodeClusterObj.productId = refCodeClusterObj.productId.toString()
        refCodeClusterObj.affiliateId = refCodeClusterObj.affiliateId.toString()
        refCodeClusterObj.campaignId = refCodeClusterObj.campaignId.toString()
        return refCodeClusterObj
    } catch (e) {
        console.log('reformatRefCodeData:', e)
    }

}

module.exports = recipeData