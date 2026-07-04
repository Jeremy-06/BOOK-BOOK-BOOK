const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book");
const upload = require("../utils/multer");

// List books
router.get("/", bookController.getAllBooks);
// Search books
router.get("/autocomplete", bookController.autocompleteBooks);
// Fetch book
router.get("/:id", bookController.getSingleBook);
// Create book
router.post("/", upload.array("images", 10), bookController.createBook);
// Update book
router.put("/:id", upload.array("images", 10), bookController.updateBook);
// Delete book
router.delete("/:id", bookController.deleteBook);

module.exports = router;
