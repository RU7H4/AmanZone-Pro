require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// --- FIREBASE ENGINE ---
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyC8SsMUZYY465oloInKP-vCtOuSpLqSsDM",
    authDomain: "amanzone-trading.firebaseapp.com",
    projectId: "amanzone-trading"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MY_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Helper to send messages back to you
async function sendBotReply(text) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: MY_CHAT_ID, text: text })
        });
    } catch (err) {
        console.error("Telegram Error:", err);
    }
}

// --- 1. THE CHECKOUT ROUTE (From your website) ---
app.post('/api/checkout', async (req, res) => {
    try {
        const { name, phone, address, items, total } = req.body;
        const msg = `🚨 *NEW ORDER*\n👤: ${name}\n📞: ${phone}\n📍: ${address}\n🛒 *ITEMS:*\n${items}\n💰 *Total:* ${total} ETB`;
        await sendBotReply(msg);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// --- 2. THE ADMIN BOT ROUTE (From your phone) ---
app.post('/api/bot', async (req, res) => {
    res.sendStatus(200); // Tell Telegram "Message Received" instantly

    const msg = req.body.message;
    if (!msg || !msg.text) return; // Ignore images/edits for now

    const chatId = msg.chat.id.toString();
    const text = msg.text.trim();

    // 🔍 X-RAY LOGS FOR RENDER 
    console.log(`[WEBHOOK] Incoming message from Chat ID: ${chatId}`);
    console.log(`[WEBHOOK] Your Server expects ID:     ${MY_CHAT_ID}`);
    console.log(`[WEBHOOK] You typed: ${text}`);

    // SECURITY CHECK
    if (chatId !== MY_CHAT_ID) {
        console.log(`[WEBHOOK] ❌ BLOCKED: The Chat IDs do not match!`);
        return;
    }

    if (text.startsWith('/add')) {
        console.log("[WEBHOOK] Processing /add command...");
        try {
            // Cut out the "/add " part and split by commas
            const rawString = text.substring(4).trim(); 
            const rawData = rawString.split(',');

            if (rawData.length < 3) {
                console.log("[WEBHOOK] ❌ Format error.");
                return sendBotReply("⚠️ Format error. Use:\n/add Name, Category, Price, ImageLink");
            }

            const newProduct = {
                name: rawData[0].trim(),
                category: rawData[1].trim(),
                price: rawData[2].trim(),
                image: rawData[3] ? rawData[3].trim() : "No Image"
            };

            await addDoc(collection(db, "products"), newProduct);
            console.log("[WEBHOOK] ✅ Saved to Firebase!");
            sendBotReply(`✅ Success! Added to database:\n📦 ${newProduct.name}\n💰 ${newProduct.price} ETB`);

        } catch (error) {
            console.error("[WEBHOOK] ❌ Firebase Error:", error);
            sendBotReply("❌ Error saving to database.");
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is live on port ${PORT}`);
});