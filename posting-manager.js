const schedule = require("node-schedule");
const cron = require("node-cron");
const utils = require("./utils.js");
const hubRepost = require("./reposter/hub-repost.js");
const tiktokStats = require("./tiktok-stats.js");

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
        execDate.setDate(execDate.getDate() + 1);
        schedule.scheduleJob(execDate, () => {
          console.log(
            `Posting for ${account.pseudo} (${account.social_media})`
          );
          hubRepost.hubRepost(db, account);
        });
      }
    }
  });
}

function init(db) {
  schedulingTodayPosting(db);
  cron.schedule("0 0 * * *", () => {
    schedulingTodayPosting(db);
  });
}

module.exports = { init };
