const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    longUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    customCode: { type: String, unique: true, sparse: true },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
});

module.exports = mongoose.models.Url || mongoose.model('Url', urlSchema);
