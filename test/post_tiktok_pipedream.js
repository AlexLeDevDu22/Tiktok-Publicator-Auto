const https = require("https")

const data = JSON.stringify({
    "description": "Wich initials will belong together #love #initials #foryou #fyp",
    "account_id": "6596f5abc3b752215a41f892",
    "url": "https://file-examples.com/storage/fef4e75e176737761a179bf/2017/04/file_example_MP4_480_1_5MG.mp4",
    "schedule_datetime": "2024-11-19T23:20"
})

const options = {
    hostname: "eow8b2atjh8pzco.m.pipedream.net",
    port: 443,
    path: "/",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
    },
}

const req = https.request(options)
req.write(data)
req.end()