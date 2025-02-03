const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const validUrl = require('valid-url');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
});
app.use(limiter);

// Prevent reconnecting in tests
if (!mongoose.connection.readyState) {
    mongoose.connect(process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/urlshortener', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

// Load Model (Ensure it's only defined once)
const Url = require('./models/Url');

app.post('/shorten', async (req, res) => {
    const { longUrl, customCode, expiresIn } = req.body;

    if (!validUrl.isUri(longUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }
    try {
        let shortCode = customCode || shortid.generate();

        if (customCode) {
            const existingUrl = await Url.findOne({ customCode });
            if (existingUrl) {
                return res.status(400).json({ error: 'Custom code already in use' });
            }
        }
        const expiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const url = new Url({
            longUrl,
            shortCode,
            customCode: customCode || undefined,
            expiresAt,
        });
        await url.save();
        res.status(201).json({
            shortenedUrl: `http://localhost:${PORT}/${shortCode}`,
            expiresAt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const url = await Url.findOne({
            $or: [{ shortCode }, { customCode: shortCode }],
        });
        if (url) {
            if (url.expiresAt && new Date() > url.expiresAt) {
                return res.status(410).json({ error: 'URL has expired' });
            }
            url.clicks += 1;
            await url.save();
            return res.redirect(url.longUrl);
        } else {
            return res.status(404).json({ error: 'Short URL not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/:shortCode/analytics', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const url = await Url.findOne({
            $or: [{ shortCode }, { customCode: shortCode }],
        });
        if (url) {
            return res.json({
                longUrl: url.longUrl,
                clicks: url.clicks,
                createdAt: url.createdAt,
                expiresAt: url.expiresAt,
            });
        } else {
            return res.status(404).json({ error: 'Short URL not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
