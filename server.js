const config = require('plain-config')();
const logger = require('bunyan-loader')(config.log).child({scope: 'server.js'})
const cluster = require('cluster');
const numCores = config.cores || require('os').cpus().length;
const hostname = require('os').hostname();
const metrics = require('./lib/metrics')

if (cluster.isMaster) {

    logger.info(`Master pid:${process.pid} is running`);
    logger.info(`Using node ${process.version} in mode ${config.env} spawning ${numCores} processes, port ${config.port}`)


    for (let i = 0; i < numCores; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.info(`worker ${worker.process.pid} died`);
    });

    cluster.on('message', (worker, msg, handle) => {
        // if (msg.setCacheAffiliateProgramGlobally) {
        //
        //     if (cache[msg.key] === undefined) {
        //         cache[msg.key] = msg.setCacheAffiliateProgramGlobally
        //         // pino.info(`Cache set for ${msg.key} and will expire in: 60 Minutes`)
        //
        //         setTimeout(function () {
        //             pino.info("Deleted ref from cache. RefCode : " + JSON.stringify(cache[msg.key]));
        //             if (cache[msg.key]) {
        //                 delete cache[msg.key];
        //             }
        //         }, 60 * 60 * 1000);
        //
        //         worker.send({
        //             setCacheAffiliateProgramGlobally: true,
        //             cache: cache,
        //             key: msg.key
        //         });
        //     }
        // }
        // if (msg.getCache) {
        //     worker.send({
        //         getCacheReply: "getCacheReply",
        //         cache: cache[msg.key]
        //     })
        // }

    })
} else {
    require('./worker')
}

