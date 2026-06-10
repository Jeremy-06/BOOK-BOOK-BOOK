const db = require("../models");
const Book = db.Book;
const Stock = db.Stock;

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [{ model: Stock }],
    });
    return res.status(200).json({ rows: books });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching books" });
  }
};

exports.getSingleBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Stock }],
    });

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    return res.status(200).json({ success: true, result: book });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching book" });
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description, price, isbn, quantity } = req.body;
    const imagePaths = req.files
      ? req.files.map((file) => file.path.replace(/\\/g, "/"))
      : [];

    if (!title || !author || !price || !isbn) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const book = await Book.create({
      title,
      author,
      description,
      price,
      isbn,
      img_path: JSON.stringify(imagePaths),
      created_at: Date.now(),
    });

    const stock = await Stock.create({
      book_id: book.book_id,
      quantity: quantity || 0,
    });

    return res.status(201).json({
      success: true,
      bookId: book.book_id,
      image: imagePaths,
      quantity,
      book,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error creating book", details: error.message });
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, description, price, isbn, quantity } = req.body;
    const imagePaths = req.files
      ? req.files.map((file) => file.path.replace(/\\/g, "/"))
      : [];

    if (!title || !author || !price || !isbn) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updateData = {
      title,
      author,
      description,
      price,
      isbn,
    };

    if (imagePaths.length > 0) {
      updateData.img_path = JSON.stringify(imagePaths);
    }

    await Book.update(updateData, { where: { book_id: id } });

    await Stock.update({ quantity }, { where: { book_id: id } });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error updating book", details: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    await Stock.destroy({ where: { book_id: id } });
    await Book.destroy({ where: { book_id: id } });

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error deleting book", details: error.message });
  }
};
