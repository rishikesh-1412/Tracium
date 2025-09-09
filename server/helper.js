// flag = 1 => yyyy-mm
// flag = 2 => yyyy-mm-dd (start of month)
// flag = 3 => yyyy-mm-dd (end of month)
function getMonthsBetween(startMonth, endMonth, userEndDate, flag) {

    const result = [];
  
    let start = new Date(startMonth + "-01");
    const end = new Date(endMonth + "-01");
  
    while (start <= end) {
      const year = start.getFullYear();
      const month = (start.getMonth() + 1).toString().padStart(2, '0');
      const lastDay = new Date(year, start.getMonth() + 1, 0).getDate();

      const lastDayDate = `${year}-${month}-${lastDay}`;
      if(lastDayDate > userEndDate) break;

      flag == 1 ? result.push(`${year}-${month}`) : flag == 2 ? result.push(`${year}-${month}-01`) : result.push(`${year}-${month}-${lastDay}`);
      start.setMonth(start.getMonth() + 1);
    }
    return result;
}

module.exports = { getMonthsBetween };