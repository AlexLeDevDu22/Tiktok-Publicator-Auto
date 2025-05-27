const https = require("https");
const { URL } = require("url");

// Main video posting function
async function hubRepost(db, account, schedule) {
  console.log(`Posting for ${account.pseudo} (${account.social_media})`);

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

  // Post the video
  uploadVideo(account, videoToPost, schedule);

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

  return `Video uploaded successfully: ${videoToPost.id} for account ${account.pseudo}`;
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
 * Upload a video to a TikTok account using the Zapier API.
 * @param {Object} account - The account to upload the video to.
 * @param {Object} videoToPost - The video to upload.
 * @param {string} schedule - The date to schedule the video for.
 */
async function uploadVideo(account, videoToPost, schedule) {
  // Première requête PATCH
  const patchData = JSON.stringify({
    zdl: {
      app: "EngineAPI",
      type: "run",
      action: "series_skip_errors",
      id: "series_299667490",
      zdl_version: "0.4",
      steps: [
        {
          id: "299667490",
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
          id: "_GEN_1748188434247",
          authentication_id: 50674384,
          params: {
            method: "schedule",
            organizationId: "6596f43117e44cb6b911ba65",
            channelId: account.id,
            scheduling_type: "direct",
            text: videoToPost.description,
            video:
              "https://www.tikwm.com/video/media/play/" +
              videoToPost.link.split("/").reverse()[0] +
              ".mp4",
            scheduled_at: schedule
              .toLocaleString("en-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
              .replace(",", ""),
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
    title: "",
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
      "X-CSRFToken":
        "i70DalPUgdEgkVf541s7f5uwa9JNaQ6lOtEthX7fn3uaDRc7E1jB19bcyFCKVjRE",
      Origin: "https://zapier.com",
      "Alt-Used": "zapier.com",
      Connection: "keep-alive",
      Referer:
        "https://zapier.com/editor/299667490/draft/_GEN_1748188434247/sample",
      Cookie:
        "visitor_id=7d9a6b21-dda1-4c26-a5ee-79e9d457338d; _dd_s=rum=0&expire=1748191504783&logs=1&id=6b9b6c62-d538-41e5-a531-10682b44fec9&created=1748188434256; session_id=aca3ec42-2699-4c19-a81b-2264a06d2b49; zapidentity=-756356569; ssohint=7b37135c-c13b-46e9-b667-cff353566dd7; zapha=true; csrftoken=i70DalPUgdEgkVf541s7f5uwa9JNaQ6lOtEthX7fn3uaDRc7E1jB19bcyFCKVjRE; billing_downgrade_flow_reorder=1; ssoid=eyJzayI6ImdBQUFBQUJvTTBWOUloZVlKQllkYlVJSUpHbS1RcXVMVmR3N0tpZXZSQ0xIV0JFSXNpcEY2R2YtSWc3a08zNFZhUFpGcGtld0hBa19JTFFjQlQzaHFESFgwVmZKOE5DYkYyMnV2cWlvck9WTjRZOTdDZ3JRalozVXd6dlZpUTNtZG9QcEg1R0JfR3RxIiwiY2lkIjoxODEyNDI2OX0:1uJEEP:WcNYbaFRG8aOToMfZATxEQZ6afbPMNdQ_ZQB00cQWJw; signonidentity=REVQUkVDQVRFRA; zapsession=i0vi72bz5z64aawf9we95ewsluncjs1a; AMP_66c1d651b8=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIyN2RkOTdmMS03MzA5LTQ2YjMtYTI3MS00YjZlMzUzMzE4OGElMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIxODEyNDI2OSUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDgxODg0MzQzMTglMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4MTkwNjA0ODczJTJDJTIybGFzdEV2ZW50SWQlMjIlM0E5NCUyQyUyMnBhZ2VDb3VudGVyJTIyJTNBMCU3RA==; AMP_MKTG_66c1d651b8=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRmFjY291bnRzLmdvb2dsZS5jb20lMkYlMjIlMkMlMjJyZWZlcnJpbmdfZG9tYWluJTIyJTNBJTIyYWNjb3VudHMuZ29vZ2xlLmNvbSUyMiU3RA==; intercom-id-su0xp8g6=f0158741-0bc2-41f2-882d-a7aba47b21e8; intercom-session-su0xp8g6=K1pqT1dobWVhVEZCZ09zYjI3K2t6V0NFbnFmam0vSm5NQU9UR3VTbEs3RDl1dElJVVBLeTNOWXpSdE5Tcy83d0dWV283OGx1ak45b0NTdkZUNXFadGd2ZXJqem84QXZSL0RwQTNZdkI4a0E9LS1wWE5WSkJFQ0JUb0MzeTlpZDQzV1hnPT0=--827b4d687336fe03ae8b3b68ce95e250aedca8a2; intercom-device-id-su0xp8g6=c18c9ded-10df-4925-956c-c0859c4c7253; OptanonConsent=isGpcEnabled=0&datestamp=Sun+May+25+2025+18%3A29%3A50+GMT%2B0200+(Central+European+Summer+Time)&version=202401.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0004%3A1%2CC0005%3A1%2CC0002%3A1%2CC0003%3A1%2CC0001%3A1&AwaitingReconsent=false; OptanonConsentInSided=C0005; _gcl_au=1.1.141136851.1748188445; fs_lua=1.1748190581022; fs_uid=#1XM#df50416c-68b8-44d3-a18c-9a3bb2cd198d:0e1af4ce-03bb-4394-968d-4d771003ae64:1748188446157::10#a484bb1c#/1779724468; _tt_enable_cookie=1; _ttp=01JW42DG1W4MWMC0M9FEHNWB77_.tt.1; ttcsid_CCLOU5BC77U1QCQHCUEG=1748188446783::FCJZLEnQzJOLS7xhY-5j.1.1748190604855; ttcsid=1748188446783::IxALEbXQLelp78y2obkW.1.1748190604856; lastVisitedPage=plans; _gcl_aw=GCL.1748188973.Cj0KCQjw_8rBBhCFARIsAJrc9yAfGCDpq0Z-VHrUnvv_qruBeiKjYyj9G7X0RW9shpMNlHhFgvBvDT0aAkBDEALw_wcB; _gcl_gs=2.1.k1$i1748188963$u206606488; NPS_180ad05e_last_seen=1748189438275; currentAccountId=18124313; _uetsid=7cd6d1d0398011f09644d39bffa45338; _uetvid=7cd6c000398011f091ce37c3d3808f85",
    },
  };

  try {
    console.log("Exécution de la première requête PATCH...");
    const patchResponse = await makeRequest(
      "https://zapier.com/api/gulliver/storage/v1/zaps/299667490?account_id=18124313",
      patchOptions,
      patchData
    );
    console.log(
      `Première requête terminée avec le statut: ${patchResponse.statusCode}`
    );

    // Deuxième requête POST
    const postOptions = {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        "X-CSRFToken":
          "i70DalPUgdEgkVf541s7f5uwa9JNaQ6lOtEthX7fn3uaDRc7E1jB19bcyFCKVjRE",
        Origin: "https://zapier.com",
        "Alt-Used": "zapier.com",
        Connection: "keep-alive",
        Referer:
          "https://zapier.com/editor/299667490/draft/_GEN_1748188434247/sample",
        Cookie:
          "visitor_id=7d9a6b21-dda1-4c26-a5ee-79e9d457338d; _dd_s=rum=0&expire=1748190015806&logs=1&id=6b9b6c62-d538-41e5-a531-10682b44fec9&created=1748188434256; session_id=aca3ec42-2699-4c19-a81b-2264a06d2b49; zapidentity=-756356569; ssohint=7b37135c-c13b-46e9-b667-cff353566dd7; zapha=true; csrftoken=i70DalPUgdEgkVf541s7f5uwa9JNaQ6lOtEthX7fn3uaDRc7E1jB19bcyFCKVjRE; currentAccountId=18124313; billing_downgrade_flow_reorder=1; ssoid=eyJzayI6ImdBQUFBQUJvTXpfSEhqZFJUYmhxbElpWlJDdHZOenJfanN4c05QZjlnMjd3dng2b1RqSEl6NVp4QXpIUmhzaEwxZHVlRnVnR3U5TEVFOGQtcENjODRaRlZIVG12aG0xN05GRmNzbFk5NzFhTlp2SjVMNWtteDNSUVk3RzgxUlZGNkRHTlJUcDFRT29iIiwiY2lkIjoxODEyNDI2OX0:1uJDqp:srpKu6qRspwN8itTiCCgpYAd6mo4z6sz1uL2EGb9ju0; signonidentity=REVQUkVDQVRFRA; zapsession=i0vi72bz5z64aawf9we95ewsluncjs1a; AMP_66c1d651b8=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIyN2RkOTdmMS03MzA5LTQ2YjMtYTI3MS00YjZlMzUzMzE4OGElMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIxODEyNDI2OSUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDgxODg0MzQzMTglMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4MTg4OTA1MjM3JTJDJTIybGFzdEV2ZW50SWQlMjIlM0E1OCUyQyUyMnBhZ2VDb3VudGVyJTIyJTNBMCU3RA==; AMP_MKTG_66c1d651b8=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRmFjY291bnRzLmdvb2dsZS5jb20lMkYlMjIlMkMlMjJyZWZlcnJpbmdfZG9tYWluJTIyJTNBJTIyYWNjb3VudHMuZ29vZ2xlLmNvbSUyMiU3RA==; intercom-id-su0xp8g6=f0158741-0bc2-41f2-882d-a7aba47b21e8; intercom-session-su0xp8g6=cHljNmplcVY2M3MzblpoUjh5SS9teng5N2ZwUEFXTDZvbllxcjVGM28zTVlQSG9RWWdyb1VBK086OHZrQ2V2YXlWWWtDZXNlZHZQWDA0SXh6Vm81amZuWEFxM3lZUGVQWXliRzlQaFd1ajA9LS1MT3BkT3hEcTBwTnllQzJDM1JpcmdnPT0=--5916c72357222531523d657ba6a22bf044147bee; intercom-device-id-su0xp8g6=c18c9ded-10df-4925-956c-c0859c4c7253; OptanonConsent=isGpcEnabled=0&datestamp=Sun+May+25+2025+18%3A02%3A52+GMT%2B0200+(Central+European+Summer+Time)&version=202401.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0004%3A1%2CC0005%3A1%2CC0002%3A1%2CC0003%3A1%2CC0001%3A1&AwaitingReconsent=false; OptanonConsentInSided=C0005; _gcl_au=1.1.141136851.1748188445; fs_lua=1.1748188952477; fs_uid=#1XM#df50416c-68b8-44d3-a18c-9a3bb2cd198d:0e1af4ce-03bb-4394-968d-4d771003ae64:1748188446157::2#/1779724449; _tt_enable_cookie=1; _ttp=01JW42DG1W4MWMC0M9FEHNWB77_.tt.1; ttcsid_CCLOU5BC77U1QCQHCUEG=1748188446783::FCJZLEnQzJOLS7xhY-5j.1.1748188967054; ttcsid=1748188446783::IxALEbXQLelp78y2obkW.1.1748188966744; lastVisitedPage=plans; _gcl_aw=GCL.1748188973.Cj0KCQjw_8rBBhCFARIsAJrc9yAfGCDpq0Z-VHrUnvv_qruBeiKjYyj9G7X0RW9shpMNlHhFgvBvDT0aAkBDEALw_wcB; _gcl_gs=2.1.k1$i1748188963$u206606488; _uetsid=7cd6d1d0398011f09644d39bffa45338; _uetvid=7cd6c000398011f091ce37c3d3808f85",
      },
    };

    console.log("Exécution de la deuxième requête POST...");
    const postResponse = await makeRequest(
      "https://zapier.com/api/gulliver/steptesting/v2/zaps/299667490/steps/_GEN_1748188434247/output/test/run?account_id=18124313",
      postOptions,
      "{}"
    );
    console.log(
      `Deuxième requête terminée avec le statut: ${postResponse.statusCode}`
    );

    console.log("Script terminé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'exécution:", error.message);
    process.exit(1);
  }
}

module.exports = { hubRepost };
