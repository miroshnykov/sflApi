const config = require('plain-config')()
const {catchHandler} = require('../middlewares/catchErr')


let recipeData = {
    getRefcodeInfo: async (req, res, next) => {
        try {
            let response = {}
            res.send(response)

        } catch (e) {
            catchHandler(e, 'getRecipeDataErr')
            console.log('getRecipeDataError:', e)
            next(e)
        }
    }
}

module.exports = recipeData