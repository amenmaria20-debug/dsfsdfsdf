// Import necessary libraries
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Create Express application
const app = express();
const PORT = process.env.PORT || 4000; // Default to port 4000

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint to verify the server is running
app.get('/', (req, res) => {
  res.send('Backend server running correctly.');
});

// Endpoint to search profiles on Torre public API
app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search term is required.' });
  }

  const torreApiUrl = 'https://torre.ai/api/entities/_searchStream';

  try {
    const response = await axios.post(torreApiUrl, {
      query: query
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'text'
    });

    const rawData = response.data;
    const lines = rawData.split('\n');

    const searchResults = [];
    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsedLine = JSON.parse(line);
          searchResults.push(parsedLine);
        } catch (parseError) {
          console.warn('Warning: Could not parse line as JSON:', line, parseError.message);
        }
      }
    }

    res.json(searchResults);

  } catch (error) {
    console.error('Error making request to Torre API:', error.message);
    if (error.response) {
      console.error('Torre API response error details:', error.response.data);
      console.error('HTTP status:', error.response.status);
    }
    res.status(500).json({ error: 'Error searching profiles on Torre API.' });
  }
});

// NEW ENDPOINT: Get profile details by username
app.get('/api/profile/:username', async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  const torreGenomeApiUrl = `https://torre.ai/api/genome/bios/${username}`;

  try {
    const response = await axios.get(torreGenomeApiUrl);
    res.json(response.data);

  } catch (error) {
    console.error('Error fetching profile genome:', error.message);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.status(500).json({ error: 'Error fetching profile details.' });
  }
});

// Start server on defined port
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
