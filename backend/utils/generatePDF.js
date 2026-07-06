const path = require("path");
const PDFDocument = require("pdfkit");

const resolveLogoPath = () => {
  const candidates = [
    path.join(__dirname, "..", "images", "logo.jpg"),
    path.join(__dirname, "..", "..", "frontend", "images", "logo.jpg"),
  ];

  return candidates.find(
    (candidate) => candidate && candidate.endsWith("logo.jpg"),
  );
};

const generatePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const logoPath = resolveLogoPath();

      try {
        if (logoPath) {
          doc.image(logoPath, 45, 35, { width: 60 });
        }
      } catch (imageError) {
        console.error("Logo image failed", imageError);
      }

      doc.fontSize(24).font("Helvetica-Bold").text("BOOK BOOK BOOK", 120, 38);
      doc.fontSize(13).font("Helvetica-Bold").text("Official Receipt", 120, 70);
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Invoice #${order.id || "N/A"}`, 120, 90);
      doc.text(
        `Date: ${new Date(order.date_placed || Date.now()).toLocaleString()}`,
        120,
        107,
      );
      doc.moveTo(40, 135).lineTo(555, 135).stroke();
      doc.moveDown(1.4);

      doc.fontSize(14).font("Helvetica-Bold").text("Customer Details");
      doc.fontSize(11).font("Helvetica");
      const customer = order.User?.Customer || {};
      const customerName = [order.User?.first_name, order.User?.last_name]
        .filter(Boolean)
        .join(" ");
      const customerAddress = customer.address || "N/A";
      const customerPhone = customer.phone || "N/A";
      doc.text(`Name: ${customerName || "N/A"}`);
      doc.text(`Email: ${order.User?.email || "N/A"}`);
      doc.text(`Phone: ${customerPhone}`);
      doc.text(`Address: ${customerAddress}`);
      doc.moveDown(1);

      doc.fontSize(14).font("Helvetica-Bold").text("Items");
      doc.fontSize(11).font("Helvetica");
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").text("Title", 40, doc.y);
      doc.text("Qty", 335, doc.y);
      doc.text("Price", 445, doc.y);
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

      const lines = order.OrderLines || [];
      let subtotal = 0;

      lines.forEach((line) => {
        const book = line.Book || {};
        const unitPrice = Number(line.price || 0);
        const qty = Number(line.quantity || 0);
        const total = unitPrice * qty;
        subtotal += total;
        doc.moveDown(0.25);
        doc.font("Helvetica").text(book.title || "Unknown Book", 40, doc.y, {
          width: 270,
          align: "left",
        });
        doc.text(String(qty), 335, doc.y);
        doc.text(`PHP${total.toFixed(2)}`, 445, doc.y);
      });

      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      const shippingFee = Number(order.shipping_fee || 0);
      const total = subtotal + shippingFee;
      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`Total Price: PHP${total.toFixed(2)}`, 400, doc.y + 8);
      doc.moveDown(1.2);
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .text("Thank you for shopping with BOOK BOOK BOOK.");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generatePDF;
