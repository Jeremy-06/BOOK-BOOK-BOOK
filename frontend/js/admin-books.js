$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;
  let selectedImages = [];
  let existingImages = [];
  let deletedImageIds = [];
  let selectedMainCover = null;
  let categories = [];
  let selectedCategoryId = "";
  let booksTable = null;

  const rawToken = sessionStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/"/g, "") : null;
  const rawRole = sessionStorage.getItem("role");
  const userRole = rawRole ? rawRole.replace(/"/g, "") : null;

  if (!token || userRole !== "admin") {
    Swal.fire({ icon: "error", text: "Access Denied. Admins only." }).then(
      () => (window.location.href = "../home.html"),
    );
    return;
  }

  // Escape value
  function escapeHtml(value) {
    return $("<div>")
      .text(value || "")
      .html();
  }

  // Validate field
  function validateRequiredField($field) {
    if (!$field.val().trim()) {
      $field.addClass("is-invalid").removeClass("is-valid");
      return false;
    }

    $field.addClass("is-valid").removeClass("is-invalid");
    return true;
  }

  // Validate form
  function validateRequiredFields($form) {
    let isValid = true;

    $form.find(".required-field").each(function () {
      if (!validateRequiredField($(this))) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Clear state
  function clearValidationState($form) {
    $form.find(".required-field").removeClass("is-invalid is-valid");
  }

  // Parse images
  function parseImages(imageValue) {
    if (!imageValue) return [];

    try {
      const parsed = JSON.parse(imageValue);
      return Array.isArray(parsed) ? parsed : [imageValue];
    } catch (error) {
      return [imageValue];
    }
  }

  // Get images
  function getBookImages(book) {
    return getBookImageRecords(book).map((image) => image.path);
  }

  function getBookCategoryName(book) {
    return book.Category && book.Category.name
      ? book.Category.name
      : "Uncategorized";
  }

  function renderCategoryOptions(categoryId = "") {
    const options = ['<option value="">Select Category</option>'];

    categories.forEach((category) => {
      const isSelected = String(category.id) === String(categoryId);
      options.push(
        `<option value="${category.id}" ${isSelected ? "selected" : ""}>${escapeHtml(category.name)}</option>`,
      );
    });

    $("#bookCategory").html(options.join(""));
    selectedCategoryId = categoryId || "";
  }

  function fetchCategories() {
    $.ajax({
      method: "GET",
      url: `${url}/api/v1/categories`,
      dataType: "json",
      headers: { Authorization: "Bearer " + token },
      success: function (data) {
        categories = data.rows || [];
        renderCategoryOptions(selectedCategoryId);
      },
      error: function () {
        categories = [];
        renderCategoryOptions("");
      },
    });
  }

  // Get records
  function getBookImageRecords(book) {
    if (Array.isArray(book.BookImages) && book.BookImages.length > 0) {
      return [...book.BookImages]
        .sort((first, second) => Number(second.is_main) - Number(first.is_main))
        .map((image) => ({
          id: image.book_image_id,
          path: image.image_path,
          isMain: Boolean(image.is_main),
        }));
    }

    return parseImages(book.img_path).map((imagePath, index) => ({
      id: null,
      path: imagePath,
      isMain: index === 0,
    }));
  }

  // Main cover
  function getMainCoverValue() {
    if (selectedMainCover) return selectedMainCover;

    if (existingImages.length > 0) {
      return existingImages[0].id
        ? `existing:${existingImages[0].id}`
        : `existing-path:${existingImages[0].path}`;
    }

    if (selectedImages.length > 0) {
      return `new:${selectedImages[0].id}`;
    }

    return "";
  }

  // Ensure cover
  function ensureMainCover() {
    const mainCover = getMainCoverValue();
    const isExistingMain =
      mainCover.startsWith("existing:") &&
      existingImages.some(
        (image) => String(image.id) === mainCover.replace("existing:", ""),
      );
    const isLegacyExistingMain =
      mainCover.startsWith("existing-path:") &&
      existingImages.some(
        (image) => image.path === mainCover.replace("existing-path:", ""),
      );
    const isNewMain =
      mainCover.startsWith("new:") &&
      selectedImages.some(
        (image) => image.id === mainCover.replace("new:", ""),
      );

    selectedMainCover =
      isExistingMain || isLegacyExistingMain || isNewMain ? mainCover : null;
  }

  // Preview images
  function renderImagePreviews() {
    ensureMainCover();

    const mainCover = getMainCoverValue();
    let previewHtml = "";

    existingImages.forEach((image) => {
      const mainValue = image.id
        ? `existing:${image.id}`
        : `existing-path:${image.path}`;
      previewHtml += `
        <div class="image-preview-item border rounded p-2 bg-light">
          <img src="${url}/${image.path}" class="rounded border mb-2" alt="Book image preview">
          <div class="form-check small">
            <input class="form-check-input main-cover-radio" type="radio" name="mainCoverPreview" value="${escapeHtml(mainValue)}" ${mainCover === mainValue ? "checked" : ""}>
            <label class="form-check-label">Set as Main Cover</label>
          </div>
          <button type="button" class="btn btn-danger btn-sm w-100 mt-2 remove-existing-image" data-id="${image.id || ""}" data-path="${escapeHtml(image.path)}">Delete</button>
        </div>
      `;
    });

    selectedImages.forEach((image) => {
      const mainValue = `new:${image.id}`;
      previewHtml += `
        <div class="image-preview-item border rounded p-2 bg-light">
          <button type="button" class="btn btn-danger btn-sm remove-image-btn remove-new-image" data-id="${image.id}">X</button>
          <img src="${image.previewUrl}" class="rounded border mb-2" alt="Selected image preview">
          <div class="form-check small">
            <input class="form-check-input main-cover-radio" type="radio" name="mainCoverPreview" value="${mainValue}" ${mainCover === mainValue ? "checked" : ""}>
            <label class="form-check-label">Set as Main Cover</label>
          </div>
        </div>
      `;
    });

    $("#image-preview-container").html(previewHtml);
  }

  // Reset queue
  function resetImageQueue() {
    selectedImages = [];
    existingImages = [];
    deletedImageIds = [];
    selectedMainCover = null;
    $("#img").val("");
    $("#image-preview-container").empty();
  }

  // Build form data
  function buildBookFormData() {
    const formData = new FormData();

    formData.append("title", $("#title").val());
    formData.append("author", $("#author").val());
    formData.append("description", $("#desc").val());
    formData.append("price", $("#price").val());
    formData.append("isbn", $("#isbn").val());
    formData.append("category_id", $("#bookCategory").val());
    formData.append("quantity", $("#qty").val());
    formData.append(
      "existing_images",
      JSON.stringify(existingImages.map((image) => image.path)),
    );
    formData.append("deletedImageIds", JSON.stringify(deletedImageIds));

    const mainCover = getMainCoverValue();
    if (mainCover.startsWith("new:")) {
      const selectedImageId = mainCover.replace("new:", "");
      const selectedImageIndex = selectedImages.findIndex(
        (image) => image.id === selectedImageId,
      );
      const selectedImage = selectedImages[selectedImageIndex];
      formData.append("main_cover", `new:${selectedImageIndex}`);
      if (selectedImage) {
        formData.append("main_cover_filename", selectedImage.file.name);
      }
    } else if (mainCover.startsWith("existing:")) {
      const imageId = mainCover.replace("existing:", "");
      formData.append("main_cover_id", imageId);
      formData.append("main_cover", mainCover);
    } else {
      formData.append("main_cover", mainCover);
    }

    selectedImages.forEach((image) => {
      formData.append("images", image.file);
    });

    return formData;
  }

  // Cover image
  function getCoverImage(book) {
    const images = getBookImages(book);
    return images.length > 0
      ? `<img src="${url}/${images[0]}" width="40" height="50" class="rounded" alt="Book cover">`
      : '<span class="badge bg-secondary">No Image</span>';
  }

  // Stock badge
  function renderStockBadge(book) {
    const qty = book.Stock ? book.Stock.quantity : 0;
    return qty > 0
      ? `<span class="badge bg-success">${qty}</span>`
      : '<span class="badge bg-danger">Out of Stock</span>';
  }

  // Action buttons
  function renderActionButtons(book) {
    return `
      <button class="btn btn-sm btn-outline-primary editBtn" data-id="${book.book_id}"><i class="fas fa-edit"></i></button>
      <button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${book.book_id}"><i class="fas fa-trash-alt"></i></button>
    `;
  }

  // Init table
  function initBooksTable() {
    booksTable = $("#btable").DataTable({
      serverSide: true,
      processing: true,
      ajax: {
        url: `${url}/api/v1/books`,
        headers: { Authorization: "Bearer " + token },
        error: function () {
          Swal.fire({ icon: "error", text: "Unable to load books." });
        },
      },
      columns: [
        { data: "book_id" },
        {
          data: null,
          orderable: false,
          render: (data, type, book) => getCoverImage(book),
        },
        {
          data: "title",
          render: (data) => escapeHtml(data),
        },
        {
          data: "author",
          render: (data) => escapeHtml(data),
        },
        {
          data: "price",
          render: (data) => `PHP ${escapeHtml(data)}`,
        },
        {
          data: "isbn",
          render: (data) => escapeHtml(data),
        },
        {
          data: null,
          orderable: false,
          render: (data, type, book) => escapeHtml(getBookCategoryName(book)),
        },
        {
          data: null,
          orderable: false,
          render: (data, type, book) => renderStockBadge(book),
        },
        {
          data: null,
          orderable: false,
          render: (data, type, book) => renderActionButtons(book),
        },
      ],
      order: [[0, "desc"]],
      language: {
        emptyTable: "No books found.",
      },
    });
  }

  $("#addBookBtn").on("click", function () {
    $("#bookId").remove();
    $("#bform").trigger("reset");
    clearValidationState($("#bform"));
    resetImageQueue();
    renderCategoryOptions("");
    $("#bookUpdate").hide();
    $("#bookSubmit").show();
    $("#bookModal").modal("show");
  });

  $("#img").on("change", function () {
    const files = Array.from(this.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      const imageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      reader.onload = function (event) {
        selectedImages.push({
          id: imageId,
          file,
          previewUrl: event.target.result,
        });
        renderImagePreviews();
      };

      reader.readAsDataURL(file);
    });

    $(this).val("");
  });

  $(document).on("change", ".main-cover-radio", function () {
    selectedMainCover = $(this).val();
    renderImagePreviews();
  });

  $(document).on("click", ".remove-existing-image", function () {
    const imageId = $(this).data("id");
    const imagePath = $(this).data("path");

    if (imageId && !deletedImageIds.includes(Number(imageId))) {
      deletedImageIds.push(Number(imageId));
    }

    existingImages = existingImages.filter((image) => {
      if (imageId) {
        return String(image.id) !== String(imageId);
      }

      return image.path !== imagePath;
    });

    if (
      selectedMainCover === `existing:${imageId}` ||
      selectedMainCover === `existing-path:${imagePath}`
    ) {
      selectedMainCover = null;
    }

    renderImagePreviews();
  });

  $(document).on("click", ".remove-new-image", function () {
    const imageId = $(this).data("id");
    selectedImages = selectedImages.filter((image) => image.id !== imageId);

    if (selectedMainCover === `new:${imageId}`) {
      selectedMainCover = null;
    }

    renderImagePreviews();
  });

  $("#bform").on("input change", ".required-field", function () {
    validateRequiredField($(this));
  });

  $("#bform").on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const submitter = e.originalEvent ? e.originalEvent.submitter : null;
    const isUpdate =
      (submitter && submitter.id === "bookUpdate") ||
      (!submitter && $("#bookId").length > 0);
    const id = $("#bookId").val();

    if (!validateRequiredFields($form)) {
      return Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields highlighted in red.",
      });
    }

    $.ajax({
      method: isUpdate ? "PUT" : "POST",
      url: isUpdate ? `${url}/api/v1/books/${id}` : `${url}/api/v1/books`,
      data: buildBookFormData(),
      contentType: false,
      processData: false,
      success: function () {
        $("#bookModal").modal("hide");
        booksTable.ajax.reload(null, false);
        Swal.fire({
          icon: "success",
          title: isUpdate ? "Updated!" : "Added!",
          text: isUpdate
            ? "Book updated successfully."
            : "Book created successfully.",
          timer: 1500,
        });
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text:
            error.responseJSON?.error ||
            (isUpdate ? "Error updating book" : "An error occurred"),
        });
      },
    });
  });

  $("#btable tbody").on("click", ".editBtn", function (e) {
    e.preventDefault();
    $("#bookId").remove();
    $("#bform").trigger("reset");
    clearValidationState($("#bform"));
    resetImageQueue();

    const id = $(this).data("id");
    $("#bookModal").modal("show");
    $("<input>")
      .attr({ type: "hidden", id: "bookId", name: "book_id", value: id })
      .appendTo("#bform");

    $("#bookSubmit").hide();
    $("#bookUpdate").show();

    $.ajax({
      method: "GET",
      url: `${url}/api/v1/books/${id}`,
      success: function (data) {
        const book = data.result;
        $("#title").val(book.title);
        $("#author").val(book.author);
        $("#desc").val(book.description);
        $("#price").val(book.price);
        $("#isbn").val(book.isbn);
        renderCategoryOptions(
          book.category_id || (book.Category ? book.Category.id : ""),
        );
        $("#qty").val(book.Stock ? book.Stock.quantity : 0);

        existingImages = getBookImageRecords(book);
        const mainImage = Array.isArray(book.BookImages)
          ? book.BookImages.find((image) => image.is_main)
          : null;
        selectedMainCover = mainImage
          ? `existing:${mainImage.book_image_id}`
          : null;
        renderImagePreviews();
      },
    });
  });

  $("#btable tbody").on("click", ".deleteBtn", function (e) {
    e.preventDefault();
    const id = $(this).data("id");

    bootbox.confirm(
      "Are you sure you want to delete this book?",
      function (result) {
        if (!result) return;

        $.ajax({
          method: "DELETE",
          url: `${url}/api/v1/books/${id}`,
          success: function () {
            booksTable.ajax.reload(null, false);
            Swal.fire({ icon: "success", text: "Book deleted", timer: 1500 });
          },
          error: function (error) {
            Swal.fire({
              icon: "error",
              text: error.responseJSON?.error || "Error deleting book",
            });
          },
        });
      },
    );
  });

  fetchCategories();
  initBooksTable();
});