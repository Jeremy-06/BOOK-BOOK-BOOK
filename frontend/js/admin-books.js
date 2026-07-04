$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;
  const limit = 25;
  let currentPage = 1;
  let isFetching = false;
  let hasMoreBooks = true;
  let currentSortBy = "id";
  let currentSortOrder = "DESC";
  let selectedImages = [];
  let existingImages = [];
  let deletedImageIds = [];
  let selectedMainCover = null;

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

  function escapeHtml(value) {
    return $("<div>").text(value || "").html();
  }

  function validateRequiredField($field) {
    if (!$field.val().trim()) {
      $field.addClass("is-invalid").removeClass("is-valid");
      return false;
    }

    $field.addClass("is-valid").removeClass("is-invalid");
    return true;
  }

  function validateRequiredFields($form) {
    let isValid = true;

    $form.find(".required-field").each(function () {
      if (!validateRequiredField($(this))) {
        isValid = false;
      }
    });

    return isValid;
  }

  function clearValidationState($form) {
    $form.find(".required-field").removeClass("is-invalid is-valid");
  }

  function parseImages(imageValue) {
    if (!imageValue) return [];

    try {
      const parsed = JSON.parse(imageValue);
      return Array.isArray(parsed) ? parsed : [imageValue];
    } catch (error) {
      return [imageValue];
    }
  }

  function getBookImages(book) {
    return getBookImageRecords(book).map((image) => image.path);
  }

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
      selectedImages.some((image) => image.id === mainCover.replace("new:", ""));

    selectedMainCover =
      isExistingMain || isLegacyExistingMain || isNewMain ? mainCover : null;
  }

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

  function resetImageQueue() {
    selectedImages = [];
    existingImages = [];
    deletedImageIds = [];
    selectedMainCover = null;
    $("#img").val("");
    $("#image-preview-container").empty();
  }

  function buildBookFormData() {
    const formData = new FormData();

    formData.append("title", $("#title").val());
    formData.append("author", $("#author").val());
    formData.append("description", $("#desc").val());
    formData.append("price", $("#price").val());
    formData.append("isbn", $("#isbn").val());
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

  function getCoverImage(book) {
    const images = getBookImages(book);
    return images.length > 0
      ? `<img src="${url}/${images[0]}" width="40" height="50" class="rounded" alt="Book cover">`
      : '<span class="badge bg-secondary">No Image</span>';
  }

  function renderBookRow(book) {
    const qty = book.Stock ? book.Stock.quantity : 0;
    const stockHtml =
      qty > 0
        ? `<span class="badge bg-success">${qty}</span>`
        : '<span class="badge bg-danger">Out of Stock</span>';

    return `
      <tr data-id="${book.book_id}">
        <td>${book.book_id}</td>
        <td>${getCoverImage(book)}</td>
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>PHP ${escapeHtml(book.price)}</td>
        <td>${escapeHtml(book.isbn)}</td>
        <td>${stockHtml}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary editBtn" data-id="${book.book_id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${book.book_id}"><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>
    `;
  }

  function fetchBooks() {
    if (isFetching || !hasMoreBooks) return;

    isFetching = true;

    $.ajax({
      method: "GET",
      url: `${url}/api/v1/books?page=${currentPage}&limit=${limit}&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}`,
      dataType: "json",
      success: function (data) {
        const books = data.rows || [];

        if (currentPage === 1 && books.length === 0) {
          $("#bbody").html(
            '<tr><td colspan="8" class="text-center text-muted py-4">No books found.</td></tr>',
          );
        } else {
          $("#bbody").append(books.map(renderBookRow).join(""));
        }

        hasMoreBooks = Boolean(data.hasMore);
        currentPage += 1;
      },
      error: function () {
        Swal.fire({ icon: "error", text: "Unable to load books." });
      },
      complete: function () {
        isFetching = false;
      },
    });
  }

  function refreshBooks() {
    currentPage = 1;
    hasMoreBooks = true;
    isFetching = false;
    $("#bbody").empty();
    fetchBooks();
  }

  $(".custom-table-scroll").on("scroll", function () {
    if (
      Math.ceil($(this).scrollTop() + $(this).innerHeight()) >=
      $(this)[0].scrollHeight - 5
    ) {
      fetchBooks();
    }
  });

  $("#btable").on("click", "th.sortable", function () {
    const sortBy = $(this).data("sort");

    if (currentSortBy === sortBy) {
      currentSortOrder = currentSortOrder === "ASC" ? "DESC" : "ASC";
    } else {
      currentSortBy = sortBy;
      currentSortOrder = "ASC";
    }

    currentPage = 1;
    hasMoreBooks = true;
    isFetching = false;
    $("#bbody").empty();
    fetchBooks();
  });

  $("#addBookBtn").on("click", function () {
    $("#bookId").remove();
    $("#bform").trigger("reset");
    clearValidationState($("#bform"));
    resetImageQueue();
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
        refreshBooks();
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
    const $row = $(this).closest("tr");

    bootbox.confirm(
      "Are you sure you want to delete this book?",
      function (result) {
        if (!result) return;

        $.ajax({
          method: "DELETE",
          url: `${url}/api/v1/books/${id}`,
          success: function () {
            $row.fadeOut(300, function () {
              $(this).remove();
            });
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

  refreshBooks();
});
