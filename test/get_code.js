const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cookieParser());
app.use(cors());
app.listen(process.env.PORT || 3000);

const CLIENT_KEY = 'sbaw9bvwbxzgwqvr9y' // this value can be found in app's developer portal

app.get('/tiktok-oauth', (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += '?client_key=' + CLIENT_KEY;
    url += '&scope=user.info.basic,video.publish,video.upload,artist.certification.read,artist.certification.update,user.info.profile,user.info.stats,video.list';
    url += '&response_type=code';
    url += '&redirect_uri=https://example.com';
    url += '&state=' + csrfState;

    res.redirect(url);
})

'https://www.tiktok.com/v2/auth/authorize/?client_key=sbaw9bvwbxzgwqvr9y&scope=user.info.basic,video.publish,video.upload,artist.certification.read,artist.certification.update,user.info.profile,user.info.stats,video.list&response_type=code&redirect_uri=https://example.com'
