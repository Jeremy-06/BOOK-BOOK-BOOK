const db = require("../models");
const { Op } = require("sequelize");
const Book = db.Book;
const Stock = db.Stock;
const BookImage = db.BookImage;

// Parse number
function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Sort order
function getSortOrder(value) {
  return String(value || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
}

// Sort books
function getBookSortColumn(value) {
  const sortColumns = {
    id: "book_id",
    book_id: "book_id",
    title: "title",
    author: "author",
    price: "price",
    isbn: "isbn",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  return sortColumns[value] || sortColumns.id;
}

// Parse images
function parseStoredImages(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch (error) {
    return [value];
  }
}

// Parse images
function parseJsonArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// Normalize paths
function normalizeFilePaths(files) {
  return files ? files.map((file) => file.path.replace(/\\/g, "/")) : [];
}

// Normalize cover
function normalizeMainImage(
  imagePaths,
  selectedMainCover,
  files = [],
  mainCoverFilename = "",
) {
  if (imagePaths.length === 0) return null;

  if (mainCoverFilename) {
    const matchingFileIndex = files.findIndex((file) => {
      const normalizedPath = file.path ? file.path.replace(/\\/g, "/") : "";
      return (
        file.originalname === mainCoverFilename ||
        file.filename === mainCoverFilename ||
        normalizedPath === mainCoverFilename ||
        normalizedPath.endsWith(`/${mainCoverFilename}`)
      );
    });

    if (matchingFileIndex >= 0 && imagePaths[matchingFileIndex]) {
      return imagePaths[matchingFileIndex];
    }
  }

  if (selectedMainCover) {
    const [type, ...valueParts] = selectedMainCover.split(":");
    const value = valueParts.join(":");

    if (type === "new") {
      const index = parseInt(value, 10);
      if (Number.isInteger(index) && imagePaths[index]) {
        return imagePaths[index];
      }
    }

    if (type === "existing" && imagePaths.includes(value)) {
      return value;
    }
  }

  return imagePaths[0];
}

// Sort images
function sortImagesWithMainFirst(imagePaths, mainImagePath) {
  if (!mainImagePath) return imagePaths;
  return [
    mainImagePath,
    ...imagePaths.filter((imagePath) => imagePath !== mainImagePath),
  ];
}

// Sync images
async function syncBookImages(bookId, imagePaths, mainImagePath, transaction) {
  await BookImage.destroy({ where: { book_id: bookId }, transaction });

  if (imagePaths.length === 0) return;

  await BookImage.bulkCreate(
    imagePaths.map((imagePath) => ({
      book_id: bookId,
      image_path: imagePath,
      is_main: imagePath === mainImagePath,
    })),
    { transaction },
  );
}

// Ensure images
async function ensureLegacyBookImages(book, existingImagePaths, transaction) {
  const existingImageCount = await BookImage.count({
    where: { book_id: book.book_id },
    transaction,
  });

  if (existingImageCount > 0 || existingImagePaths.length === 0) {
    return;
  }

  await BookImage.bulkCreate(
    existingImagePaths.map((imagePath, index) => ({
      book_id: book.book_id,
      image_path: imagePath,
      is_main: index === 0,
    })),
    { transaction },
  );
}

// Fetch books
exports.getAllBooks = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 0);
    const sortBy = getBookSortColumn(req.query.sortBy || "id");
    const sortOrder = getSortOrder(req.query.sortOrder || "DESC");
    const search = String(req.query.search || "").trim();
    const queryOptions = {
      include: [
        { model: Stock },
        {
          model: BookImage,
          where: { is_main: true },
          required: false,
        },
      ],
      order: [[sortBy, sortOrder]],
      distinct: true,
    };

    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { title: { [Op.substring]: search } },
          { author: { [Op.substring]: search } },
          { isbn: { [Op.substring]: search } },
        ],
      };
    }

    if (limit > 0) {
      // Offset limit
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const result = await Book.findAndCountAll(queryOptions);

    return res.status(200).json({
      rows: result.rows,
      count: result.count,
      page,
      limit: limit || result.count,
      hasMore: limit > 0 ? page * limit < result.count : false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching books" });
  }
};

// Search books
exports.autocompleteBooks = async (req, res) => {
  try {
    const searchValue = String(req.query.q || "").trim();

    if (!searchValue) {
      return res.status(200).json([]);
    }

    const books = await Book.findAll({
      where: {
        title: {
          [Op.substring]: searchValue,
        },
      },
      include: [
        {
          model: BookImage,
          where: { is_main: true },
          required: false,
        },
      ],
      limit: 5,
      order: [["title", "ASC"]],
    });

    return res.status(200).json(books);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching autocomplete results" });
  }
};

// Fetch book
exports.getSingleBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Stock }, { model: BookImage }],
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

// Create book
exports.createBook = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { title, author, description, price, isbn, quantity } = req.body;
    const imagePaths = normalizeFilePaths(req.files);
    const mainImagePath = normalizeMainImage(
      imagePaths,
      req.body.main_cover,
      req.files || [],
      req.body.main_cover_filename,
    );
    const orderedImagePaths = sortImagesWithMainFirst(imagePaths, mainImagePath);

    if (!title || !author || !price || !isbn) {
      await transaction.rollback();
      return res.status(400).json({ error: "Missing required fields" });
    }

    const book = await Book.create({
      title,
      author,
      description,
      price,
      isbn,
      img_path: JSON.stringify(orderedImagePaths),
      created_at: Date.now(),
    }, { transaction });

    const stock = await Stock.create({
      book_id: book.book_id,
      quantity: quantity || 0,
    }, { transaction });

    await syncBookImages(
      book.book_id,
      orderedImagePaths,
      mainImagePath,
      transaction,
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      bookId: book.book_id,
      image: orderedImagePaths,
      quantity,
      book,
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error creating book", details: error.message });
  }
};

// Update book
exports.updateBook = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { title, author, description, price, isbn, quantity } = req.body;
    const uploadedFiles = req.files || [];
    const submittedExistingImagePaths = parseJsonArray(
      req.body.existing_images,
    ).filter((imagePath) => typeof imagePath === "string" && imagePath);
    const deletedImageIds = parseJsonArray(req.body.deletedImageIds)
      .map((imageId) => parseInt(imageId, 10))
      .filter((imageId) => Number.isInteger(imageId) && imageId > 0);
    const existingBook = await Book.findByPk(id, { transaction });

    if (!title || !author || !price || !isbn) {
      await transaction.rollback();
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!existingBook) {
      await transaction.rollback();
      return res.status(404).json({ error: "Book not found" });
    }

    const updateData = {
      title,
      author,
      description,
      price,
      isbn,
    };

    await ensureLegacyBookImages(
      existingBook,
      submittedExistingImagePaths.length > 0
        ? submittedExistingImagePaths
        : parseStoredImages(existingBook.img_path),
      transaction,
    );

    await Book.update(updateData, { where: { book_id: id }, transaction });

    await Stock.update({ quantity }, { where: { book_id: id }, transaction });

    if (deletedImageIds.length > 0) {
      await BookImage.destroy({
        where: {
          book_id: id,
          book_image_id: { [Op.in]: deletedImageIds },
        },
        transaction,
      });
    }

    const createdImages = [];

    for (const file of uploadedFiles) {
      const imagePath = file.path.replace(/\\/g, "/");
      const image = await BookImage.create(
        {
          book_id: id,
          image_path: imagePath,
          is_main: false,
        },
        { transaction },
      );

      createdImages.push({ image, file, imagePath });
    }

    await BookImage.update(
      { is_main: false },
      { where: { book_id: id }, transaction },
    );

    let mainCoverWasSet = false;
    const mainCoverId = parseInt(req.body.main_cover_id, 10);

    if (Number.isInteger(mainCoverId) && mainCoverId > 0) {
      const [affectedRows] = await BookImage.update(
        { is_main: true },
        {
          where: {
            book_id: id,
            book_image_id: mainCoverId,
          },
          transaction,
        },
      );

      mainCoverWasSet = affectedRows > 0;
    }

    if (!mainCoverWasSet && req.body.main_cover_filename) {
      const mainCoverFile = createdImages.find(({ file, imagePath }) => {
        return (
          file.originalname === req.body.main_cover_filename ||
          file.filename === req.body.main_cover_filename ||
          imagePath === req.body.main_cover_filename ||
          imagePath.endsWith(`/${req.body.main_cover_filename}`)
        );
      });

      if (mainCoverFile) {
        await mainCoverFile.image.update(
          { is_main: true },
          { transaction },
        );
        mainCoverWasSet = true;
      }
    }

    if (!mainCoverWasSet && req.body.main_cover) {
      if (req.body.main_cover.startsWith("existing:")) {
        const legacyMainCoverId = parseInt(
          req.body.main_cover.replace("existing:", ""),
          10,
        );

        if (Number.isInteger(legacyMainCoverId) && legacyMainCoverId > 0) {
          const [affectedRows] = await BookImage.update(
            { is_main: true },
            {
              where: {
                book_id: id,
                book_image_id: legacyMainCoverId,
              },
              transaction,
            },
          );

          mainCoverWasSet = affectedRows > 0;
        }
      } else if (req.body.main_cover.startsWith("existing-path:")) {
        const legacyMainCoverPath = req.body.main_cover.replace(
          "existing-path:",
          "",
        );
        const [affectedRows] = await BookImage.update(
          { is_main: true },
          {
            where: {
              book_id: id,
              image_path: legacyMainCoverPath,
            },
            transaction,
          },
        );

        mainCoverWasSet = affectedRows > 0;
      } else if (req.body.main_cover.startsWith("new:")) {
        const newImageIndex = parseInt(req.body.main_cover.replace("new:", ""), 10);
        const newMainImage = createdImages[newImageIndex];

        if (newMainImage) {
          await newMainImage.image.update(
            { is_main: true },
            { transaction },
          );
          mainCoverWasSet = true;
        }
      }
    }

    let finalImages = await BookImage.findAll({
      where: { book_id: id },
      order: [["book_image_id", "ASC"]],
      transaction,
    });

    if (
      finalImages.length > 0 &&
      !finalImages.some((image) => Boolean(image.is_main))
    ) {
      await finalImages[0].update({ is_main: true }, { transaction });
      finalImages = await BookImage.findAll({
        where: { book_id: id },
        order: [["book_image_id", "ASC"]],
        transaction,
      });
    }

    const orderedImagePaths = finalImages
      .sort((first, second) => {
        const mainSort = Number(second.is_main) - Number(first.is_main);
        if (mainSort !== 0) return mainSort;
        return first.book_image_id - second.book_image_id;
      })
      .map((image) => image.image_path);

    await Book.update(
      { img_path: JSON.stringify(orderedImagePaths) },
      { where: { book_id: id }, transaction },
    );

    await transaction.commit();

    return res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error updating book", details: error.message });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    await BookImage.destroy({ where: { book_id: id } });
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
