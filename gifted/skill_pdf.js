const { evt } = require("../gift");
const PDFDocument = require('pdfkit'); // Ensure pdfkit is installed (npm install pdfkit)
const fs = require('fs');

evt.commands.push({
    pattern: "topdf",
    category: "skills",
    function: async (from, Gifted, conText) => {
        const { args, reply, m } = conText;
        const text = args.join(" ");
        if (!text) return reply("❓ Provide the text you want to convert to PDF.");

        const fileName = `./${m.sender.split('@')[0]}.pdf`;
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(fileName));

        // Skill: Professional formatting
        doc.fontSize(25).text('𝐗-𝐆𝐔𝐑𝐔 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐃𝐎𝐂𝐔𝐌𝐄𝐍𝐓', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(text);
        doc.end();

        // Wait for file to be created then send
        setTimeout(async () => {
            await Gifted.sendMessage(from, { 
                document: fs.readFileSync(fileName), 
                mimetype: 'application/pdf', 
                fileName: 'X-Guru-Skill.pdf',
                caption: `✅ *𝐏𝐃𝐅 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
            });
            fs.unlinkSync(fileName); // Clean up
        }, 2000);
    }
});
