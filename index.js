const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

// PDF path (तुझं PDF project फोल्डरमध्ये टाकून नाव दे: free_content.pdf)
const PDF_PATH = path.join(__dirname, "free_content.pdf");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ["Ubuntu", "Chrome", "22.04"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log("📲 Scan the QR below to connect:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("🔌 Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
      else console.log("❌ Logged out. Please delete 'auth_info' folder and restart.");
    } else if (connection === "open") {
      console.log("✅ WhatsApp bot is ready!");
    }
  });

  // Menu text
  const getMenu = () => `
👋 Welcome from *ALL EXAM KATTA*!
Please choose an option to continue:

1️⃣ - TEST SERIES
2️⃣ - LIVE COURSES
3️⃣ - FREE CONTENT
4️⃣ - FREE CONTENT (PDF)
5️⃣ - OTHER (custom message)

📱 App: https://play.google.com/store/apps/details?id=co.diy7.drtks
▶️ YouTube: https://youtube.com/@allexamkatta4283?si=DrZFrEgxT6vtF7SD
📢 Telegram: https://t.me/allexamkattapune
📸 Instagram: https://www.instagram.com/all_exam_katta?igsh=MTR0MGJqZDE4MGFleQ==
👍 Facebook: https://www.facebook.com/share/1Fg1QfseEW/
`;

  // Handle messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const userMessage =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption;

    if (!userMessage) return;

    console.log(`💬 Message from ${from}: ${userMessage}`);

    let reply;

    switch (userMessage.trim()) {
      case "1":
        reply = "📘 TEST SERIES: Our test series will help you crack exams with confidence!";
        break;
      case "2":
        reply = "🎥 LIVE COURSES: Join our live interactive courses today!";
        break;
      case "3":
        reply = "🎁 FREE CONTENT: Access free notes, quizzes and much more!";
        break;
      case "4":
        // Send PDF file
        if (fs.existsSync(PDF_PATH)) {
          await sock.sendMessage(from, {
            document: { url: PDF_PATH },
            mimetype: "application/pdf",
            fileName: "Free_Content.pdf"
          });
          return;
        } else {
          reply = "⚠️ PDF not found on server. Please upload free_content.pdf in project folder.";
        }
        break;
      case "5":
        reply = "ℹ️ You chose OTHER. From here, you can chat directly without bot interference.";
        break;
      default:
        reply = getMenu();
    }

    if (reply) {
      await sock.sendMessage(from, { text: reply });
    }
  });
}

startBot();

