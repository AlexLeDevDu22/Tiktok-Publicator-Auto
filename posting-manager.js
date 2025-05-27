const schedule = require("node-schedule");
const cron = require("node-cron");
const utils = require("./utils.js");
const hubRepost = require("./hub-repost.js");
const tiktokStats = require("./tiktok-stats.js");

/**
 * Schedule the posting for today for all accounts.
 * @param {mysql2/promise} db - The MySQL database connection.
 * @returns {Promise<void>} - A promise that resolves when all schedules have been set.
 */
async function schedulingTodayPosting(db) {
  (await utils.getAccountsData(db, "*")).forEach(async (account) => {
    // each account
    let bestHoursToPost = await tiktokStats.bestHoursToPost(
      account,
      account.daily_tiktok_count
    );
    for (let i = 0; i < account.daily_tiktok_count; i++) {
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
        scheduleHours,
        0,
        0
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

module.exports = { init };
