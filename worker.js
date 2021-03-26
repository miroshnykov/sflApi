const express = require('express');
const app = express();
const refCode = require(`./routes/refCode`)
const config = require('plain-config')()
const logger = require('bunyan-loader')(config.log).child({scope: 'worker.js'})
const cors = require('cors')
const crypto = require('crypto')

app.use(cors())

app.set('trust proxy', true)


app.get('/favicon.ico', (req, res) => {
    res.sendStatus(404)
})

// app.use(async (req, res, next) => {
//
//     let str = req.query.timestamp + '|' + req.baseUrl + req.path + '|' + config.affiliate_program_secret;
//
//     let hash = crypto.createHash('md5')
//         .update(str)
//         .digest('hex');
//     //
//     // if (!req.query.hash || req.query.hash.toLowerCase() !== hash) {
//     //     // logger.info('validation failed!', 'got:', req.query.hash ? req.query.hash.toLowerCase() : 'undefined', 'must be:', hash);
//     //     logger.info(`validation failed! got ${req.query.hash} must be: ${hash}`)
//     //     res.status(403).end('forbidden')
//     // } else {
//     //     next()
//     // }
//
//
// });


app.use('/refcode', refCode.getRefcodeInfo)

app.use('/health', (req, res, next) => {
    res.send('Ok')
})

app.use(require('./middlewares/not-found'));

app.use(require('./middlewares/error'));

app.listen({port: config.port}, () => {
        // console.log(JSON.stringify(config))
        // console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port}, worker pid:${process.pid} , env:${config.env}\x1b[0m \n`)
        logger.info(`🚀 Server ready at http://localhost:${config.port}, worker pid:${process.pid}, env:${config.env}`)
    }
)