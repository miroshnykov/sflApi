let dbMysql = require('./mysqlDb').get()
let mysqlPool = require('./mysqlPool')
const metrics = require('../lib/metrics')

const refCode = async (data) => {

    let {ref, prodId} = data
    try {

        let refCodeInfo = await mysqlPool.query(` 
                SELECT r.affiliate_id AS affiliateId,
                       concat(a.first_name, " ", a.last_name) AS affiliateName,
                       a.employee_id AS accountExecutiveId,
                       (SELECT e.name FROM employees e WHERE e.id = a.employee_id ) AS accountExecutiveName,                       
                       a.account_mgr_id AS accountManagerId,
                       (SELECT e.name FROM employees e WHERE e.id = a.account_mgr_id ) AS accountManagerName,
                       a.\`status\` AS affiliateStatus,
                       a.affiliate_type AS affiliateType,       
                       r.campaign_id AS campaignId,
                       r.program_id AS programId,
                       (SELECT p.name FROM programs p WHERE p.id = r.program_id) AS programName, 
                       a.is_traffic_blocked AS isTrafficBlocked,
                       a.is_lock_payment AS isLockPayment                       
                FROM ref_codes AS r
                LEFT JOIN affiliates AS a ON r.affiliate_id = a.id
                WHERE r.id = ?
        `, [ref])

        if (refCodeInfo.length === 0) {
            metrics.influxdb(500, `refCodeDataIsNullSetBanktanTraxDefaultAff`)
            metrics.influxdb(500, `refCodeBroken-${ref}`)
            return {
                affiliateId: '4391',
                affiliateName: "Banktan Trax",
                accountExecutiveId: 0,
                accountExecutiveName: '',
                accountManagerId: 0,
                accountManagerName: '',
                affiliateStatus: "active",
                affiliateType: "external",
                isLockPayment: 0,
                isTrafficBlocked: 0,
                campaignId: '5134236',
                programId: '410',
                productId: prodId || 0
            }

        }
        let affiliateId = refCodeInfo[0].affiliateId


        let affiliateProductProgram = await mysqlPool.query(` 
            SELECT program_id as affiliateProductProgramId
            FROM affiliate_product_programs
            WHERE affiliate_id = ?
            AND product_id = ?
        `, [affiliateId, prodId])
        let affiliateProductProgramId = 0
        let programId = 0
        let productId = 0
        let productName = ''

        let productProgram = await mysqlPool.query(` 
                SELECT program_id as programId, 
                       name AS productName,
                       id AS productId
                FROM ac_products
                WHERE id = ?
        `, [prodId])

        if (productProgram.length !== 0) {
            programId = productProgram[0].programId
            productName = productProgram[0].productName
            productId = productProgram[0].productId
        }

        // console.log(affiliateProductProgram)
        if (affiliateProductProgram.length !== 0) {
            affiliateProductProgramId = affiliateProductProgram[0].affiliateProductProgramId
        }

        let programIdStr = affiliateProductProgramId ? affiliateProductProgramId : programId
        let campaignId = refCodeInfo[0].campaignId
        refCodeInfo[0].programId = programIdStr.toString()
        refCodeInfo[0].affiliateId = affiliateId.toString()
        refCodeInfo[0].campaignId = campaignId.toString()
        refCodeInfo[0].productName = productName
        refCodeInfo[0].productId = productId

        metrics.influxdb(200, `getRefCodeFromDB`)

        return refCodeInfo[0]
    } catch (e) {
        console.log(e)
        metrics.influxdb(500, `getRefCodeDBSQLError`)
    }
}


module.exports = {
    refCode
}