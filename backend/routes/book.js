const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book");
const upload = require("../utils/multer");

router.get("/", bookController.getAllBooks);
router.get("/autocomplete", bookController.autocompleteBooks);
router.get("/:id", bookController.getSingleBook);
router.post("/", upload.array("images", 10), bookController.createBook);
router.put("/:id", upload.array("images", 10), bookController.updateBook);
router.delete("/:id", bookController.deleteBook);

module.exports = router;
