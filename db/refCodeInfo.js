let dbMysql = require('./mysqlDb').get()

const refCode = async (data) => {

    let {ref, prodId} = data
    try {
        console.time('refCode')
        let refCodeInfo = await dbMysql.query(` 
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
                       r.product_id AS productId,
                       a.is_traffic_blocked AS isTrafficBlocked,
                       a.is_lock_payment AS isLockPayment                       
                FROM ref_codes AS r
                LEFT JOIN affiliates AS a ON r.affiliate_id = a.id
                WHERE r.id = ?
        `, [ref])
        await dbMysql.end()


        if (refCodeInfo.length ===0){
            return {
                affiliateId: 66666,
                affiliateName: "DefaultAff",
                affiliateAE: 0,
                affiliateAM: 0,
                affiliateStatus: "active",
                affiliateType: "external",
                campaignId: 66666,
                programId: 0,
                productId: 0
            }
        }
        let affiliateId = refCodeInfo[0].affiliateId

        // prodId = 31
        let affiliateProductProgram = await dbMysql.query(` 
            SELECT program_id as affiliateProductProgramId
            FROM affiliate_product_programs
            WHERE affiliate_id = ?
            AND product_id = ?
        `, [affiliateId, prodId])
        await dbMysql.end()
        let affiliateProductProgramId = 0
        let programId = 0
        // console.log(affiliateProductProgram)
        if (affiliateProductProgram.length !==0) {
            affiliateProductProgramId = affiliateProductProgram[0].affiliateProductProgramId
        } else {
            let productProgram = await dbMysql.query(` 
                SELECT program_id as programId 
                FROM ac_products
                WHERE id = ?
        `, [prodId])
            await dbMysql.end()

            if (productProgram.length !==0) {
                programId = productProgram[0].programId
            } else {
                programId = 0
            }
        }

        refCodeInfo[0].programId = affiliateProductProgramId ? affiliateProductProgramId : programId
        refCodeInfo[0].productId = prodId
        // console.log('affiliateProductProgram:',affiliateProductProgram[0])

        console.timeEnd('refCode')
        // console.log(`refCode count:${result.length}\n`)
        return refCodeInfo[0]
    } catch (e) {
        console.log(e)
    }
}


module.exports = {
    refCode
}