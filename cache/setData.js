const {catchHandler} = require('./../middlewares/catchErr')
const {getDataCache, setDataCache, delDataCache, getKeysCache} = require('./redis')
const metrics = require('../lib/metrics')
const zlib = require('zlib')
const fs = require('fs')
const JSONStream = require("JSONStream")
const config = require('plain-config')()
const logger = require('bunyan-loader')(config.log).child({scope: 'setData.js'})
const os = require('os')
const hostname = os.hostname()
const {getFileSize} = require('./../lib/utils')

const setAffiliateProductProgram = async () => {

    try {
        let file = config.recipe.affiliateProductProgram

        // let fileSizeInfo_ = await getDataCache('fileSizeInfo_')
        // if (!fileSizeInfo_) {
        //     logger.info(`Campaign not define size in redis`)
        //     return
        // }
        let size = getFileSize(file) || 0

        if (size === 0){
            console.log('affiliateProductProgram file empty ')
            return
        }
        // logger.info(`fileSizeInfo_campaigns:${fileSizeInfo_.campaign}, Size from file Campaigns:${size}`)
        // if (size === fileSizeInfo_.campaign) {
        //     logger.info(`Size the same lets add to redis  `)
        // } else {
        //     logger.info(`Size of recipe file campaigns is different , need to reSend file from sfl-offer`)
        //     metrics.influxdb(200, `fileDifferentCampaigns_-${hostname}`)
        //     return
        // }

        let affiliateProductPrograms = await getKeysCache('affiliateProductProgram-*')
        // console.log('campaigns count:',campaigns.length)

        for (const affiliateProductProgram of affiliateProductPrograms) {
            await delDataCache(affiliateProductProgram)
        }

        // console.time('setCampaignsInsertSpeed')
        let gunzip = zlib.createGunzip();

        // console.log('sflOffer config:', config.sflOffer)
        if (!file) {
            console.log('no recipe file affiliateProductPrograms')
            return
        }
        let stream = fs.createReadStream(file)
        let jsonStream = JSONStream.parse('*')
        stream.pipe(gunzip).pipe(jsonStream)
        jsonStream.on('data', async (item) => {
            if (!item.affiliatesId) {
                metrics.influxdb(500, `setAffiliateProductProgramsEmpty`)
                return
            }
            await setDataCache(`affiliateProductPrograms-${item.affiliatesId}-${item.productId}`, item)
        })

        // jsonStream.on('end', () => {
        //     console.log('campaigns end')
        // })


    } catch (e) {
        catchHandler(e, 'setAffiliateProductProgramsError')
        metrics.influxdb(500, `setAffiliateProductProgramsError`)
    }
}

const setAcProducts = async () => {

    try {
        let file = config.recipe.acProducts

        // let fileSizeInfo_ = await getDataCache('fileSizeInfo_')
        // if (!fileSizeInfo_) {
        //     logger.info(`Campaign not define size in redis`)
        //     return
        // }
        let size = getFileSize(file) || 0

        if (size === 0){
            console.log('acProducts file empty ')
            return
        }
        // logger.info(`fileSizeInfo_campaigns:${fileSizeInfo_.campaign}, Size from file Campaigns:${size}`)
        // if (size === fileSizeInfo_.campaign) {
        //     logger.info(`Size the same lets add to redis  `)
        // } else {
        //     logger.info(`Size of recipe file campaigns is different , need to reSend file from sfl-offer`)
        //     metrics.influxdb(200, `fileDifferentCampaigns_-${hostname}`)
        //     return
        // }

        let acProducts = await getKeysCache('acProduct-*')
        // console.log('campaigns count:',campaigns.length)

        for (const acProduct of acProducts) {
            await delDataCache(acProduct)
        }

        // console.time('setCampaignsInsertSpeed')
        let gunzip = zlib.createGunzip();

        // console.log('sflOffer config:', config.sflOffer)
        if (!file) {
            console.log('no recipe file acProducts')
            return
        }
        let stream = fs.createReadStream(file)
        let jsonStream = JSONStream.parse('*')
        stream.pipe(gunzip).pipe(jsonStream)
        jsonStream.on('data', async (item) => {
            if (!item.id) {
                metrics.influxdb(500, `setAcProductsEmpty`)
                return
            }
            await setDataCache(`acProduct-${item.id}`, item)
        })

        // jsonStream.on('end', () => {
        //     console.log('campaigns end')
        // })


    } catch (e) {
        catchHandler(e, 'setAcProductsError')
        metrics.influxdb(500, `setAcProductsError`)
    }
}

const setRefCodesFile = async () => {

    try {
        let file = config.recipe.refCodes

        // let fileSizeInfo_ = await getDataCache('fileSizeInfo_')
        // if (!fileSizeInfo_) {
        //     logger.info(`Campaign not define size in redis`)
        //     return
        // }
        let size = getFileSize(file) || 0

        if (size === 0){
            console.log('refCodes file empty ')
            return
        }
        // logger.info(`fileSizeInfo_campaigns:${fileSizeInfo_.campaign}, Size from file Campaigns:${size}`)
        // if (size === fileSizeInfo_.campaign) {
        //     logger.info(`Size the same lets add to redis  `)
        // } else {
        //     logger.info(`Size of recipe file campaigns is different , need to reSend file from sfl-offer`)
        //     metrics.influxdb(200, `fileDifferentCampaigns_-${hostname}`)
        //     return
        // }

        let refCodes = await getKeysCache('refCode-*')
        // console.log('campaigns count:',campaigns.length)

        for (const refCode of refCodes) {
            await delDataCache(refCode)
        }

        // console.time('setCampaignsInsertSpeed')
        let gunzip = zlib.createGunzip();

        // console.log('sflOffer config:', config.sflOffer)
        if (!file) {
            console.log('no recipe file refCodes')
            return
        }
        let stream = fs.createReadStream(file)
        let jsonStream = JSONStream.parse('*')
        stream.pipe(gunzip).pipe(jsonStream)
        jsonStream.on('data', async (item) => {
            if (!item.refCodeId) {
                metrics.influxdb(500, `setRefCodesEmpty`)
                return
            }
            await setDataCache(`refCode-${item.refCodeId}`, item)
        })

        // jsonStream.on('end', () => {
        //     console.log('campaigns end')
        // })


    } catch (e) {
        catchHandler(e, 'setRefCodesError')
        metrics.influxdb(500, `setRefCodesError`)
    }
}

module.exports = {
    setAffiliateProductProgram,
    setAcProducts,
    setRefCodesFile
}

