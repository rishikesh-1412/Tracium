async function processHourlyJobs(hourlyJobs, startDate, endDate, connection, results){
  const expectedHours = [];
  const start = new Date(startDate.replace(/-/g, "/") + ":00:00");
  const end = new Date(endDate.replace(/-/g, "/") + ":00:00");
  for (let d = new Date(start); d <= end; d.setHours(d.getHours() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    expectedHours.push(`${yyyy}-${mm}-${dd}-${hh}`);
  }

  const hourlySql = `
    SELECT jobName,
            COUNT(DISTINCT reportTime) AS presentCount,
            GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
    FROM job_stage_stats
    WHERE jobType='hourly' AND reportTime BETWEEN ? AND ?
      AND jobName IN (?)
    GROUP BY jobName
  `;
  const hourlyParams = [startDate, endDate, hourlyJobs.map((j) => j.jobName)];

  // 👇 Log the fully formatted query
  // console.log("Executing SQL:", connection.format(hourlySql, hourlyParams));

  const [hourlyRows] = await connection.execute(connection.format(hourlySql, hourlyParams));

  // console.log(hourlyRows)

  const hourlyMap = {};
  for (let row of hourlyRows) {
    hourlyMap[row.jobName] = {
      presentCount: row.presentCount,
      presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
    };
  }

  for (const job of hourlyJobs) {
    const jobData = hourlyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
    let absent = [];

    if (jobData.presentCount < expectedHours.length) {
      absent = expectedHours.filter((x) => !jobData.presentEntries.includes(x));
    }

    results.push({
      jobName: job.jobName,
      frequency: "hourly",
      // expectedCount: expectedHours.length,
      // presentCount: jobData.presentCount,
      // presentEntries: jobData.presentEntries,
      absentEntries: absent,
    });
  }
}

module.exports = {processHourlyJobs};