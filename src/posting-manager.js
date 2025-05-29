const cron = require("node-cron");
const utils = require("./utils.js");
const hubRepost = require("./hub-repost.js");
const tiktokStats = require("./tiktok-stats.js");

/**
 * Get the count of postings for a given account today.
 * @param {mysql2/promise} db - The MySQL database connection.
 * @param {number} accountId - The id of the account to get the postings count.
 * @returns {Promise<number>} - A promise that resolves with the count of postings.
 */
function getPostedTodayCount(db, accountId) {
  return db
    .execute(
      "SELECT COUNT(*) as count FROM publications WHERE at_account = ? AND DATE(date) = CURDATE()",
      [accountId]
    )
    .then(([rows]) => rows[0].count);
}

/**
 * Schedule the posting for today for all accounts.
 * @param {mysql2/promise} db - The MySQL database connection.
 * @returns {Promise<void>} - A promise that resolves when all schedules have been set.
 */
async function schedulingTodayPosting(db) {
  (await utils.getAccountsData(db, "*")).forEach(async (account) => {
    // each accounts
    let bestHoursToPost = await tiktokStats.bestHoursToPost(
      account,
      account.daily_tiktok_count
    );
    for (let i = 0; i < account.daily_tiktok_count; i++) {
      const postedToday = await getPostedTodayCount(db, account.id);
      if (i < postedToday) {
        continue;
      }
      // each posting per account
      let scheduleHours = null;
      if (account.social_media === "tiktok") {
        scheduleHours = bestHoursToPost[i];
      }
      const now = new Date();
      const execDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        scheduleHours || [17, 13, 20][i % 3],
        0,
        0
      );
	console.log(
        `Scheduling posting for account ${account.id} at ${execDate.toISOString()}`
      );
      if (execDate > now) {
        hubRepost.hubRepost(db, account, execDate);
      }
    }
  });
}

/**
 * Initialize the scheduling of the postings.
 * This function schedules the postings for today, and then schedule itself to be executed every day at 00:00.
 * @param {mysql2/promise} db - The MySQL database connection.
 */
function init(db) {
  schedulingTodayPosting(db);
  cron.schedule("0 0 * * *", () => {
    schedulingTodayPosting(db);
  });
}

module.exports = { init, getPostedTodayCount, schedulingTodayPosting };
