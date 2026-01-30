const express = require('express');
const session = require('express-session');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { URLSearchParams } = require('url');

dotenv.config();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const BOT_CLIENT_ID = process.env.BOT_CLIENT_ID;
const BOT_PERMISSIONS = process.env.BOT_PERMISSIONS || '8';

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !BOT_CLIENT_ID) {
  console.warn('تأكد من إعداد CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, BOT_CLIENT_ID في .env');
}

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // للتطوير محلياً؛ على الإنتاج استخدم secure: true مع HTTPS
}));

// تحميل أوامر من ملف JSON بسيط
const commandsPath = path.join(__dirname, 'commands.json');
let commands = [];
try {
  commands = JSON.parse(fs.readFileSync(commandsPath, 'utf8'));
} catch (e) {
  console.warn('لم أتمكّن من قراءة commands.json — أنشئ الملف أو تحقق من المسار.');
}

// رابط إضافة البوت للسيرفر (Invite)
const botInviteLink = `https://discord.com/oauth2/authorize?client_id=${BOT_CLIENT_ID}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands`;

// helper لبناء رابط التفويض
function discordAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds'
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

app.get('/', (req, res) => {
  res.render('index', {
    user: req.session.user || null,
    botInviteLink,
    botClientId: BOT_CLIENT_ID
  });
});

app.get('/commands', (req, res) => {
  res.render('commands', {
    user: req.session.user || null,
    commands
  });
});

app.get('/login', (req, res) => {
  res.redirect(discordAuthUrl());
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided.');

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;

    // جلب بيانات المستخدم
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // جلب السيرفرات (guilds) إن احتجت
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    req.session.user = {
      ...userRes.data,
      guilds: guildsRes.data
    };

    res.redirect('/');
  } catch (err) {
    console.error('OAuth error:', err.response ? err.response.data : err.message);
    res.status(500).send('OAuth failed. تحقق من إعدادات CLIENT_ID/SECRET/REDIRECT_URI.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
