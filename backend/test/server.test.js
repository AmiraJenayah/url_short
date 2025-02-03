const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Reuse the already connected app
const Url = require('../models/Url');

describe('URL Shortener API', () => {
    beforeAll(async () => {
        await Url.deleteMany({});
    });

    afterAll(async () => {
        await Url.deleteMany({});
        await mongoose.connection.close(); // Close only once after all tests
    });

    it('should shorten a valid URL', async () => {
        const res = await request(app)
            .post('/shorten')
            .send({ longUrl: 'https://example.com' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('shortenedUrl');
        expect(res.body.shortenedUrl).toMatch(/^http:\/\/localhost:\d+\/[a-zA-Z0-9]+$/);
    });

    it('should return an error for an invalid URL', async () => {
        const res = await request(app)
            .post('/shorten')
            .send({ longUrl: 'invalid-url' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('Invalid URL');
    });

    it('should redirect to the original URL', async () => {
        const url = new Url({
            longUrl: 'https://example.com',
            shortCode: 'abc123',
        });
        await url.save();

        const res = await request(app).get('/abc123');
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('https://example.com');
    });

    it('should return an error for a non-existing short URL', async () => {
        const res = await request(app).get('/nonexistent');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('Short URL not found');
    });

    it('should return analytics for a valid short URL', async () => {
        const url = new Url({
            longUrl: 'https://example.com',
            shortCode: 'test123',
            clicks: 5,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        await url.save();

        const res = await request(app).get('/test123/analytics');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('longUrl', 'https://example.com');
        expect(res.body).toHaveProperty('clicks', 5);
        expect(res.body).toHaveProperty('createdAt');
        expect(res.body).toHaveProperty('expiresAt');
    });
});
