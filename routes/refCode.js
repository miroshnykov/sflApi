const config = require('plain-config')()
const {catchHandler} = require('../middlewares/catchErr')
const {refCode} = require('../db/refCodeInfo')
const {getDataCache, setDataCache} = require('../cache/redis')

let recipeData = {
    getRefCodeInfo: async (req, res, next) => {
        try {
            let inputData = {}

            let inputRefCode = req.query.ref && Number(req.query.ref) || 0
            let inputProd = req.query.prod && Number(req.query.prod) || 0

            inputData.ref = inputRefCode
            inputData.prodId = inputProd
            let redisKey = `${inputRefCode}-${inputProd}`
            let cacheData = await getDataCache(redisKey)
            let response
            if (cacheData) {
                response = cacheData
            } else {
                response = await refCode(inputData)
                await setDataCache(redisKey, response)
            }

            res.send(response)

        } catch (e) {
            catchHandler(e, 'getRefCodeInfoErr')
            console.log('getRefCodeInfoError:', e)
            next(e)
        }
    }
}

module.exports = recipeData