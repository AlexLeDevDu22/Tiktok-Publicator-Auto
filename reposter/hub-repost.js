const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { exec } = require("child_process");

// Main video posting function
async function hubRepost(db, account, testMode = false) {
  const filePath = path.join(__dirname, "data/repost_datas.json");
  const datas = await fs.promises.readFile(filePath, "utf8");
  let jsonDatas = JSON.parse(datas);

  let videoToPost = null;
  await db
    .querry(
      "SELECT * FROM `stored_tiktoks` WHERE `niche_id` = ? AND `id` > ? LIMIT 1",
      [account.niche_belonged, account.last_tiktok_id]
    )
    .then((rows) => {
      if (rows.length > 0)
        throw new Error(
          `${account.pseudo}(${account.social_media}) has reached the maximum number of videos in list: ${currentVideosType}`
        );
      else videoToPost = rows[0];
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
  // Download the video
  const videoPath = await downloadVideo(videoToPost.link, videoIndex, account);

  // Post the video
  postVideo(account, videoPath, videoToPost.description, null, testMode);

  // update the niche
  db.querry("UPDATE `accounts` SET `last_tiktok_id` = ? WHERE `id` = ?", [
    videoToPost.id,
    account.id,
  ]);
  // save the posted video in the database
  db.querry(
    "INSRET INTO `publications` (`tiktok_id`, `at_account`, `description`, date) VALUES ",
    [videoToPost.id, account.id, videoToPost.description, new Date()]
  );

  return `Video uploaded successfully: ${videoPath}`;
}

// Video downloader with recursion on invalid video links
async function downloadVideo(link, videoIndex, account) {
  const filePath = path.join(
    "medias-tempo",
    `tiktok-${account.pseudo}-${videoIndex}.mp4`
  );
  console.log(`Downloading video from: ${link}`);

  const response = await axios({
    url:
      "https://www.tikwm.com/video/media/play/" +
      link.split("/").reverse()[0] +
      ".mp4",
    method: "GET",
    responseType: "stream",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
    },
  });
  console.log(`HTTP Status: ${response.status}`);
  console.log(`Content-Length: ${response.headers["content-length"]}`);

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return filePath;
}

function postVideo(account, videoPath, description, schedule, testMode) {
  video = {
    path: videoPath,
    description: description,
    schedule: schedule,
  };

  exec(
    `.venv/bin/python3 reposter/tiktok_upload.py ${JSON.stringify(video)} ${
      account.pseudo
    }`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
}

module.exports = { hubRepost };

//hubRepost("love.comptabilitys",null, true);
