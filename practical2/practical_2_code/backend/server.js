const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const database = require('better-sqlite3');
const speakeasy = require('speakeasy');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.post('/register', (req, res) => {
    const { name, surname, email, password, role } = req.body;
    const secret = speakeasy.generateSecret({ name: `SecureRUS (${email})` });

    const insert = database.prepare(`INSERT INTO users (name, surname, email, password, role, mfa_secret) VALUES (?, ?, ?, ?, ?, ?)`);
    try {
        const result = insert.run(name, surname, email, password, role || 'GUEST', secret.base32);
        res.json({
            userId: result.lastInsertRowid,
            otpauth_url: secret.otpauth_url
        });
    } catch (err) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/verify', (req, res) => {
    const { userId, token } = req.body;
    const user = database.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token,
        window: 1
    });

    if (!verified) return res.status(403).json({ error: 'Invalid MFA code' });
    if (!user.approved) return res.status(403).json({ error: 'User not approved yet' });

    res.json({ success: true, user });
});

app.get('/ping', (req, res) => {
    res.send('Backend is alive!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
