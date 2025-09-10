// processCustomWeeklyJobs.js
async function processWeeklyJobs(jobs, startDate, endDate, connection, results) {

    // Parse start and end dates correctly
    const [sY, sM, sD, sH] = startDate.split("-").map(Number);
    const [eY, eM, eD, eH] = endDate.split("-").map(Number);

    const start = new Date(sY, sM - 1, sD, sH);
    const end = new Date(eY, eM - 1, eD, eH);

    // Prepare SQL query with correct placeholders
    const jobNames = jobs.map(j => j.jobName);
    if (jobNames.length === 0) return;

    const placeholders = jobNames.map(() => "?").join(",");
    const sql = `
        SELECT jobName,
               COUNT(DISTINCT reportTime) AS presentCount,
               GROUP_CONCAT(DISTINCT reportTime ORDER BY reportTime) AS presentEntries,
               MIN(reportTime) AS minReportTime,
               MAX(reportTime) AS maxReportTime
        FROM job_stage_stats
        WHERE reportTime BETWEEN ? AND ?
          AND jobName IN (${placeholders})
        GROUP BY jobName
    `;
    const params = [startDate, endDate, ...jobNames];
    const [rows] = await connection.execute(sql, params);

    // Map jobName to present entries
    const presentMap = {};
    for (let row of rows) {
        const entries = row.presentEntries ? row.presentEntries.split(",").map(e => e.trim()) : [];
        presentMap[row.jobName] = {
            presentCount: row.presentCount,
            presentEntries: entries,
            minReportTime: row.minReportTime,
            maxReportTime: row.maxReportTime
        };
    }

    for (const job of jobs) {
        const jobData = presentMap[job.jobName] || { presentEntries: [], minReportTime: null, maxReportTime: null };
        let expectedTimes = [];

        if (!jobData.minReportTime) {
            // No runs at all → mark all as absent
            results.push({
                jobName: job.jobName,
                frequency: job.frequency,
                absentEntries: [],
            });
            continue;
        }

        // Determine interval in weeks
        let interval = 1; // default weekly
        if (job.frequency !== "weekly") {
            interval = parseInt(job.frequency.split("-")[0], 10);
        }

        // Base date for generating expected times
        const [y, m, d0, h] = jobData.minReportTime.split("-").map(Number);
        const baseDate = new Date(y, m - 1, d0, h);

        // Generate expected times from baseDate to end, incrementing by interval weeks
        for (let d = new Date(baseDate); d <= end; d.setDate(d.getDate() + interval * 7)) {
            expectedTimes.push(formatDate(d));
        }

        // Find absent entries
        const absent = expectedTimes.filter(x => !jobData.presentEntries.includes(x));

        results.push({
            jobName: job.jobName,
            frequency: job.frequency,
            absentEntries: absent,
        });
    }
}

// Format date to YYYY-MM-DD-HH
function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}-${hh}`;
}

module.exports = { processWeeklyJobs };
