const Influx = require('influxdb-nodejs')
const config = require('plain-config')()
const clientInfluxdb = new Influx(config.influxdb.host)
const project = config.env === 'staging' && `${config.influxdb.project}-staging` || config.influxdb.project
const os = require('os')
const _ = require('lodash')
const {diskinfo} = require('@dropb/diskinfo')
const cpu = require('cpu')
const pino = require('pino')()
const logger = require('bunyan-loader')(config.log).child({scope: 'metrics.js'})
let data_metrics = {
    start: 0,
    route: '',
    method: ''
}
const hostname = os.hostname()
let num_cpu = cpu.num();//return CPU's nums

logger.info(` *** Metrics name:${project}`)
exports.influxdb = (statusCode = 200, route = "/", method = "GET") => {
    if (config.env === 'development') return
    let data = {
        latency: Date.now() - data_metrics.start,
        code: statusCode,
        route: route,
        method: method
    }

    clientInfluxdb.write(project + '_request')
        .tag({
            project: project,
            host: hostname,
            route: data.route,
            method: data.method,
            status: _.sortedIndex([99, 199, 299, 399, 499, 599], data.code) * 100,
            spdy: _.sortedIndex([5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000], data.latency)
        })
        .field(data)
        .time(Date.now(), 'ms')
        .queue()


    // batch post to influxdb when queue length gte config.influxdb.intervalRequest
    if (clientInfluxdb.writeQueueLength >= config.influxdb.intervalRequest) {
        clientInfluxdb.syncWrite()
            .catch((error) => {
                console.error(error)
            })
    }
}


exports.setStartMetric = function (data) {
    data_metrics.start = Date.now()
    data_metrics.route = data.route
    data_metrics.method = data.method
}
