async function processDailyJobs(dailyJobs, startDate, endDate, connection, results) {
    const dailyStart = startDate.substring(0, 10);
      const dailyEnd = endDate.substring(0, 10);

      // console.log("Daily timeframe:", dailyStart, "→", dailyEnd);

      const expectedDays = [];
      const start = new Date(dailyStart);
      const end = new Date(dailyEnd);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        expectedDays.push(d.toISOString().slice(0, 10));
      }

      const dailySql = `
        SELECT jobName,
               COUNT(DISTINCT reportTime) AS presentCount,
               GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
        FROM job_stage_stats
        WHERE jobType='daily' AND reportTime BETWEEN ? AND ?
          AND jobName IN (?)
        GROUP BY jobName
      `;
      const dailyParams = [dailyStart, dailyEnd, dailyJobs.map((j) => j.jobName)];

      // 👇 Log the fully formatted query
      // console.log("Executing SQL:", connection.format(dailySql, dailyParams));

      const [dailyRows] = await connection.execute(connection.format(dailySql, dailyParams));

      // console.log(dailyRows)

      const dailyMap = {};
      for (let row of dailyRows) {
        dailyMap[row.jobName] = {
          presentCount: row.presentCount,
          presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
        };
      }

      // console.log(dailyMap)

      for (const job of dailyJobs) {
        const jobData = dailyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
        let absent = [];

        if (jobData.presentCount < expectedDays.length) {
          absent = expectedDays.filter((x) => !jobData.presentEntries.includes(x));
        }

        results.push({
          jobName: job.jobName,
          frequency: "daily",
          // expectedCount: expectedDays.length,
          // presentCount: jobData.presentCount,
          // presentEntries: jobData.presentEntries,
          absentEntries: absent,
        });
    }
}

module.exports = {processDailyJobs};