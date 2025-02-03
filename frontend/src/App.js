import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [longUrl, setLongUrl] = useState('');
    const [customCode, setCustomCode] = useState('');
    const [expiresIn, setExpiresIn] = useState(30);
    const [shortenedUrl, setShortenedUrl] = useState('');
    const [error, setError] = useState('');

    const handleShorten = async () => {
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/shorten', {
                longUrl,
                customCode,
                expiresIn,
            });

            setShortenedUrl(response.data.shortenedUrl);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shortenedUrl);
        alert('Copied to clipboard!');
    };

    return (
        <div className="App">
            <h1>URL Shortener</h1>
            <div className="form">
                <input
                    type="text"
                    placeholder="Enter your long URL"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Custom code (optional)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Expires in (days)"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                />
                <button onClick={handleShorten}>Shorten</button>
            </div>
            {error && <p className="error">{error}</p>}
            {shortenedUrl && (
                <div className="result">
                    <p>
                        Shortened URL: <a href={shortenedUrl}>{shortenedUrl}</a>
                    </p>
                    <button onClick={handleCopy}>Copy</button>
                </div>
            )}
        </div>
    );
}

export default App;