const cron = require("node-cron");
const utils = require("./utils.js");
const tiktokStats = require("./tiktok-stats.js");
const https = require("https");
const { URL } = require("url");

/**
 * Get the count of postings for a given account today.
 * @param {mysql2/promise} db - The MySQL database connection.
 * @param {number} accountId - The id of the account to get the postings count.
 * @returns {Promise<number>} - A promise that resolves with the count of postings.
 */
function getPostedTodayCount(db, accountId) {
  return db
    .execute(
      "SELECT COUNT(*) as count FROM publications WHERE at_account = ? AND DATE(date) = CURDATE() AND status != 'failed'",
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
  const accounts = await utils.getAccountsData(db, "*");

  // ✅ Utiliser for...of au lieu de forEach pour éviter les race conditions
  for (const account of accounts) {
    if (!account.active) continue;
    try {
      // Récupérer les meilleures heures une seule fois par compte
      let bestHoursToPost = await tiktokStats.bestHoursToPost(
        account,
        account.daily_tiktok_count
      );

      for (let i = 0; i < account.daily_tiktok_count; i++) {
        const accountColor = [
          `\x1b[40m`,
          `\x1b[41m`,
          `\x1b[42m`,
          `\x1b[43m`,
          `\x1b[44m`,
          `\x1b[45m`,
          `\x1b[46m`,
          `\x1b[47m`,
        ][account.id % 8]; // ✅ Couleurs de fond pour chaque compte

        const postedToday = await getPostedTodayCount(db, account.id);

        if (i < postedToday) {
          console.log(
            "\x1b[33m%s\x1b[0m",
            `Skipping post ${i + 1} for account ${
              (accountColor, account.pseudo, "\x1b[33m%s\x1b[0m")
            } - already posted for ${new Date().toLocaleString()} (${postedToday}/${
              account.daily_tiktok_count
            })`
          );
          continue;
        }

        // ✅ Récupérer last_tiktok_id depuis la DB pour éviter les conflits
        const [accountRows] = await db.query(
          "SELECT last_tiktok_id FROM accounts WHERE id = ?",
          [account.id]
        );
        const currentLastTiktokId = accountRows[0].last_tiktok_id;

        // Calculer l'horaire de publication
        let scheduleHours = null;
        if (account.social_media === "tiktok") {
          scheduleHours = bestHoursToPost[i];
        }

        const now = new Date();
        const execDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          scheduleHours || [9, 14, 19][i % 3], // ✅ Horaires plus logiques
          Math.floor(Math.random() * 60), // ✅ Ajouter quelques minutes aléatoires
          0
        );

        // ✅ Si l'heure est déjà passée, programmer pour le lendemain
        if (execDate <= now) {
          execDate.setDate(execDate.getDate() + 1);
        }
        console.log(
          "\x1b[34m%s\x1b[0m",
          `Processing posting for ${
            accountColor + account.pseudo + " \x1b[34m\x1b[0m"
          } at ${execDate ? execDate.toISOString() : "now"} (${i + 1}/${
            account.daily_tiktok_count
          })`
        );

        // ✅ Passer le last_tiktok_id actuel à hubRepost
        await hubRepost(db, account, execDate, currentLastTiktokId);
      }
    } catch (error) {
      console.error(
        `Error processing account ${
          accountColor + account.pseudo + "\x1b[0m"
        }: `,
        error.message
      );
      // ✅ Continuer avec les autres comptes même si un échoue
      continue;
    }
  }
}

// Main video posting function
async function hubRepost(
  db,
  account,
  schedule,
  lastTiktokId = null,
  testMode = false,
  accountColor = "\x1b[47m"
) {
  // ✅ Utiliser une transaction pour assurer l'atomicité
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // ✅ Si lastTiktokId n'est pas fourni, le récupérer avec un verrou
    const currentLastId =
      lastTiktokId ||
      (
        await connection.query(
          "SELECT last_tiktok_id FROM accounts WHERE id = ? FOR UPDATE",
          [account.id]
        )
      )[0][0].last_tiktok_id;

    // ✅ Sélectionner la prochaine vidéo avec verrou
    const [rows] = await connection.query(
      "SELECT * FROM `stored_tiktoks` WHERE `niche_id` = ? AND `id` > ? ORDER BY `id` ASC LIMIT 1 FOR UPDATE",
      [account.niche_belonged, currentLastId]
    );

    if (rows.length === 0) {
      throw new Error(
        `${account.pseudo}(${account.social_media}) has reached the maximum number of videos. Last ID: ${currentLastId}`
      );
    }

    const videoToPost = rows[0];

    // ✅ Vérifier qu'on n'a pas déjà publié cette vidéo pour ce compte
    const [existingPub] = await connection.query(
      "SELECT id FROM publications WHERE tiktok_id = ? AND at_account = ?",
      [videoToPost.id, account.id]
    );

    if (existingPub.length > 0) {
      console.warn(
        `Video ${videoToPost.id} already published for account ${
          accountColor + account.pseudo + "\x1b[0m"
        }, skipping`
      );
      await connection.rollback();
      connection.release();
      return;
    }

    const isMp4 = await isVideo(videoToPost.link);
    if (!isMp4) {
      console.warn(
        "\x1b[36m%s\x1b[0m",
        `Tiktok ${videoToPost.id} is not a video, next video...`
      );
      await connection.query(
        "UPDATE `accounts` SET `last_tiktok_id` = ? WHERE `id` = ?",
        [videoToPost.id + 1, account.id]
      );
      await connection.commit();
      connection.release();
      return hubRepost(db, account, schedule, videoToPost.id + 1, testMode);
    }

    if (!testMode) {
      // ✅ Mettre à jour last_tiktok_id AVANT la publication
      await connection.query(
        "UPDATE `accounts` SET `last_tiktok_id` = ? WHERE `id` = ?",
        [videoToPost.id, account.id]
      );
    }

    if (!testMode) {
      // ✅ Insérer la publication avec un statut approprié
      const publicationStatus =
        schedule && schedule > new Date() ? "scheduled" : "published";
      const publicationDate = schedule || new Date();

      await connection.query(
        "INSERT INTO `publications` (`tiktok_id`, `at_account`, `description`, `date`, `status`) VALUES (?,?,?,?,?)",
        [
          videoToPost.id,
          account.id,
          videoToPost.initial_description,
          publicationDate,
          publicationStatus,
        ]
      );
    }

    // ✅ Commit avant l'upload pour éviter les doublons même si l'upload échoue
    await connection.commit();
    connection.release();

    // Récupérer les données de l'account Zapier
    const [zapierAccount] = await connection.query(
      "SELECT * FROM `zapier_accounts` WHERE `id` = ? LIMIT 1",
      [account.zapier_belonged_id]
    );

    // ✅ Upload de la vidéo (en dehors de la transaction)
    try {
      await uploadVideo(
        zapierAccount[0],
        account,
        videoToPost,
        schedule,
        testMode
      );
      console.log(
        "\x1b[32m%s\x1b[0m",
        `Video uploaded/published successfully: ${videoToPost.id} for account ${
          accountColor + account.pseudo
        }`
      );
    } catch (uploadError) {
      console.error(
        `Upload failed for video ${videoToPost.id}, account ${account.id}:`,
        uploadError.message
      );
      if (!testMode) {
        // ✅ Marquer comme échoué au lieu de faire un rollback complet
        await db.query(
          "UPDATE `publications` SET `status` = 'failed' WHERE `tiktok_id` = ? AND `at_account` = ?",
          [videoToPost.id, account.id]
        );
      }
    }

    // ✅ Programmer la mise à jour du statut si c'est schedulé
    if (!testMode && schedule && schedule > new Date()) {
      const scheduleDate = new Date(schedule);
      const cronTime = `${scheduleDate.getMinutes()} ${scheduleDate.getHours()} ${scheduleDate.getDate()} ${
        scheduleDate.getMonth() + 1
      } *`;

      cron.schedule(
        cronTime,
        async () => {
          try {
            await db.query(
              "UPDATE `publications` SET `status` = 'published' WHERE `tiktok_id` = ? AND `at_account` = ?",
              [videoToPost.id, account.id]
            );
          } catch (cronError) {
            console.error(
              `Failed to update status for video ${videoToPost.id}:`,
              cronError.message
            );
          }
        },
        { scheduled: true }
      );
    }
  } catch (error) {
    // ✅ Rollback en cas d'erreur
    await connection.rollback();
    connection.release();
    console.error(
      `Error in hubRepost for account ${account.id}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Checks if a given URL is a video.
 *
 * @param {string} url - The URL to check.
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the URL is a video or not.
 */
function isVideo(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
      },
    };

    const req = https.request(url, options, (res) => {
      resolve(res.statusCode != 404);
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Makes an HTTPS request to a given URL with optional options and data.
 *
 * @param {string} url - The URL to make the request to.
 * @param {object} [options] - Options for the request.
 * @param {string} [data] - Data to send with the request.
 * @returns {Promise} - A promise that resolves with the response data.
 */
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Uploads a video to Buffer using the specified account, video, and schedule.
 * @param {Account} account - The account to use for the upload.
 * @param {Video} videoToPost - The video to upload.
 * @param {Date} schedule - The date and time to schedule the upload for, or null to upload now.
 * @param {boolean} [testMode=false] - If true, the upload will not be performed, only the request will be made.
 */
async function uploadVideo(
  zapierAccount,
  account,
  videoToPost,
  schedule,
  testMode = false
) {
  // Première requête PATCH
  const patchData = JSON.stringify({
    zdl: {
      app: "EngineAPI",
      type: "run",
      action: "series_skip_errors",
      id: "series_" + zapierAccount.zap_id,
      zdl_version: "0.4",
      steps: [
        {
          id: zapierAccount.zap_id.toString(),
          app: "CodeCLIAPI@1.0.1",
          type: "read",
          action: "",
          params: {},
          meta: {
            $editor: {
              has_automatic_issues: true,
            },
          },
        },
        {
          type: "write",
          app: "BufferCLIAPI@2.2.0",
          action: "update",
          id: zapierAccount.GEN_ID,
          authentication_id: zapierAccount.authentication_id,
          params: {
            method:
              schedule && schedule > new Date() ? "schedule" : "share_now",
            organizationId: zapierAccount.buffer_organization_id,
            channelId: account.id_buffer,
            scheduling_type: "direct",
            text: videoToPost.description,
            video:
              "https://www.tikwm.com/video/media/play/" +
              videoToPost.link.split("/").reverse()[0] +
              ".mp4",
            scheduled_at: schedule?.toISOString().slice(0, 16),
            attachment: "video",
          },
          meta: {
            $editor: {
              has_automatic_issues: false,
            },
            params: {
              organizationId: {
                label: "My Organization",
              },
              channelId: {
                label: `${account.pseudo} TikTok Account`,
              },
            },
          },
        },
      ],
    },
    title: "Untitled Zap",
    description: "",
    legacy_node_id: null,
    is_enabled: false,
    zap_note: "",
  });

  const patchOptions = {
    method: "PATCH",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
      "X-CSRFToken": zapierAccount.cookies.split("csrftoken=")[1].split(";")[0],
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0",
      Origin: "https://zapier.com",
      "Alt-Used": "zapier.com",
      Connection: "keep-alive",
      Referer:
        "https://zapier.com/editor/" +
        zapierAccount.zap_id +
        "/draft/" +
        zapierAccount.GEN_ID +
        "/sample",
      Cookie: zapierAccount.cookies,
    },
  };

  try {
    // console.log({
    //   url:
    //     "https://zapier.com/api/gulliver/storage/v1/zaps/" +
    //     zapierAccount.zap_id +
    //     "?account_id=" +
    //     zapierAccount.cookies.split("currentAccountId=")[1].split(";")[0],
    //   patchOptions,
    //   patchData,
    // });
    const response = await makeRequest(
      "https://zapier.com/api/gulliver/storage/v1/zaps/" +
        zapierAccount.zap_id +
        "?account_id=" +
        zapierAccount.cookies.split("currentAccountId=")[1].split(";")[0],
      patchOptions,
      patchData
    );
    if (![200, 201].includes(response.statusCode)) {
      console.error(
        "Error patching zapier account",
        response.statusCode,
        response.data
      );
      throw new Error("Failed to patch Zapier account");
    }

    // Deuxième requête POST
    const postOptions = {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        "X-CSRFToken": zapierAccount.cookies
          .split("csrftoken=")[1]
          .split(";")[0],

        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0",
        DNT: "1",
        "Sec-GPC": "1",
        Origin: "https://zapier.com",
        "Alt-Used": "zapier.com",
        Connection: "keep-alive",
        Referer:
          "https://zapier.com/editor/" +
          zapierAccount.zap_id +
          "/draft/" +
          zapierAccount.GEN_ID +
          "/sample",
        Cookie: zapierAccount.cookies,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Priority: "u=0",
        TE: "trailers",
      },
    };
    if (!testMode) {
      // console.log("\n\n\n\n", {
      //   url:
      //     "https://zapier.com/api/gulliver/steptesting/v2/zaps/" +
      //     zapierAccount.zap_id +
      //     "/steps/" +
      //     zapierAccount.GEN_ID +
      //     "/output/test/run?account_id=" +
      //     zapierAccount.cookies.split("currentAccountId=")[1].split(";")[0] +
      //     "&origin=main",
      //   postOptions,
      // });
      const postResponse = await makeRequest(
        "https://zapier.com/api/gulliver/steptesting/v2/zaps/" +
          zapierAccount.zap_id +
          "/steps/" +
          zapierAccount.GEN_ID +
          "/output/test/run?account_id=" +
          zapierAccount.cookies.split("currentAccountId=")[1].split(";")[0] +
          "&origin=main",
        postOptions,
        "{}"
      );
      if (![200, 201].includes(postResponse.statusCode)) {
        console.error("error posting", postResponse.data);
        throw new Error("Failed to post Zapier account");
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'exécution:", error.message);
    process.exit(1);
  }
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

module.exports = { init, hubRepost };
