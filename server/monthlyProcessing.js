const {getMonthsBetween} = require('./helper')

async function processMonthlyJobs(monthlyJobs, startDate, endDate, connection, results) {
    const monthlyStart = startDate.substring(0, 7);
    const monthlyEnd = endDate.substring(0, 7);

    const monthlySql = `
        SELECT jobName,
                COUNT(DISTINCT reportTime) AS presentCount,
                GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
        FROM job_stage_stats
        WHERE jobType='monthly' AND reportTime BETWEEN ? AND ?
        AND jobName IN (?)
        AND jobType = 'monthly'
        GROUP BY jobName
    `;
    const monthlyParams = [monthlyStart, monthlyEnd, monthlyJobs.map((j) => j.jobName)];

    const [monthlyRows] = await connection.execute(connection.format(monthlySql, monthlyParams));

    const monthlyMap = {};
    for (let row of monthlyRows) {
        monthlyMap[row.jobName] = {
        presentCount: row.presentCount,
        presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
        };
    }

    for (const job of monthlyJobs) {
        const jobData = monthlyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
        let expectedEntries = [];
        let absentEntries = [];

        if (jobData.presentEntries.length > 0) {
            let sampleReportTime = jobData.presentEntries[0];

            if (sampleReportTime.length === 7) {
                expectedEntries = getMonthsBetween(monthlyStart, monthlyEnd, endDate, 1);
            } else {
                const date = new Date(sampleReportTime);
                if (date.getDate() === 1) {
                    expectedEntries = getMonthsBetween(monthlyStart, monthlyEnd, endDate, 2);
                } else {
                    expectedEntries = getMonthsBetween(monthlyStart, monthlyEnd, endDate, 3);
                }
            }
        }

        absentEntries = expectedEntries.filter(item => !jobData.presentEntries.includes(item));

        results.push({
            jobName: job.jobName,
            frequency: "monthly",
            // expectedCount: expectedEntries.length,
            // presentCount: jobData.presentCount,
            // presentEntries: jobData.presentEntries,
            absentEntries: absentEntries,
        });
    }
}

module.exports = {processMonthlyJobs};
