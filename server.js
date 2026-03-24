require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path'); // Added path module
const app = express();

app.use(express.json());

// --- SERVE HTML FILES DIRECTLY FROM ROOT FOLDER ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/Admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Admin.html'));
});

// Serve style.css if you have one in the same folder
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});
// --------------------------------------------------

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_ID;

// Route to handle new orders from index.html
app.post('/api/checkout', async (req, res) => {
    const { items, total, customerInfo } = req.body;
    
    let message = `🏗️ **New AmanZone Order!**\n\n`;
    message += `👤 Customer: ${customerInfo.name}\n`;
    message += `📞 Phone: ${customerInfo.phone}\n`;
    message += `📍 Location: ${customerInfo.address}\n\n`;
    message += `🛒 Items:\n${items.map(i => `- ${i.name} (x${i.qty})`).join('\n')}\n\n`;
    message += `💰 Total: ${total} ETB`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: ADMIN_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Telegram API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AmanZone Server running on port ${PORT}`));
