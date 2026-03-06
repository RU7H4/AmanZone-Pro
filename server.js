require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// THIS is the line that was missing. It tells the server to load index.html!
app.use(express.static(__dirname));

app.post('/api/checkout', async (req, res) => {
    try {
        const { name, phone, address, items, total } = req.body;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        const msg = `🚨 *NEW SECURE ORDER*\n\n👤: ${name}\n📞: ${phone}\n📍: ${address}\n\n🛒 *ITEMS:*\n${items}\n💰 *Total:* ${total} ETB`;

        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        });

        if (telegramResponse.ok) {
            res.status(200).json({ success: true, message: "Order processed securely!" });
        } else {
            res.status(500).json({ success: false, message: "Telegram API rejected the order." });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // Notice the new message here!
    console.log(`✅ NEW Server is live! Go to http://localhost:${PORT} in your browser.`);
});