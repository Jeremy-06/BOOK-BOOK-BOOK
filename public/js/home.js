$(document).ready(function () {
  const url = "http://localhost:3000";
  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");

  if (token && userRole === "admin") {
    $("#nav-links").prepend(
      '<li class="nav-item"><a class="nav-link text-warning fw-bold" href="admin/books.html"><i class="fas fa-cogs me-1"></i>Admin Dashboard</a></li>',
    );
    $("#loginLink, #ctaLogin").replaceWith(
      '<a href="#" class="nav-link" id="logoutBtn">Logout</a>',
    );
  } else if (token) {
    $("#loginLink").replaceWith(
      '<a href="#" class="nav-link" id="logoutBtn">Logout</a>',
    );
  }

  let allBooks = [];

  function parseImages(imageValue) {
    if (!imageValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(imageValue);
      return Array.isArray(parsed) ? parsed : [imageValue];
    } catch (error) {
      return [imageValue];
    }
  }

  function renderBooks(books) {
    const query = $("#searchBox").val().trim().toLowerCase();
    const filteredBooks = books.filter((book) => {
      const searchableText =
        `${book.title || ""} ${book.author || ""} ${book.isbn || ""}`.toLowerCase();
      return searchableText.includes(query);
    });

    let html = "";

    filteredBooks.forEach((book) => {
      const images = parseImages(book.img_path);
      const imageSrc =
        images.length > 0
          ? `${url}/${images[0]}`
          : "https://via.placeholder.com/600x800?text=No+Image";
      const stockQty = book.Stock ? book.Stock.quantity : 0;
      const stockBadge =
        stockQty > 0
          ? `<span class="badge badge-soft rounded-pill px-3 py-2">In Stock ${stockQty}</span>`
          : '<span class="badge bg-danger rounded-pill px-3 py-2">Out of Stock</span>';

      html += `
                <div class="col-sm-6 col-lg-4 col-xl-3">
                    <div class="card book-card">
                        <img src="${imageSrc}" class="card-img-top book-cover" alt="${book.title || "Book cover"}">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <h5 class="card-title mb-0">${book.title || "Untitled"}</h5>
                            </div>
                            <p class="card-text text-muted small mb-3">by ${book.author || "Unknown author"}</p>
                            <div class="d-flex flex-wrap gap-2 mb-3">${stockBadge}</div>
                            <div class="mt-auto d-flex justify-content-between align-items-center gap-3">
                                <span class="price-tag">₱${book.price}</span>
                                <button class="btn btn-sm btn-outline-dark viewBtn" data-id="${book.book_id}">
                                    <i class="fas fa-eye me-1"></i>View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    });

    $("#book-catalog").html(html);
    $("#emptyState").toggleClass("d-none", filteredBooks.length > 0);
  }

  function parseBookImages(imageValue) {
    if (!imageValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(imageValue);
      return Array.isArray(parsed) ? parsed : [imageValue];
    } catch (error) {
      return [imageValue];
    }
  }

  function openProductModal(book) {
    const images = parseBookImages(book.img_path);
    const stockQty = book.Stock ? book.Stock.quantity : 0;

    $("#productModalTitle").text(book.title || "Book Details");
    $("#productModalBookTitle").text(book.title || "Untitled");
    $("#productModalAuthor").text(`by ${book.author || "Unknown author"}`);
    $("#productModalDescription").text(
      book.description || "No description available.",
    );
    $("#productModalPrice").text(`₱${book.price}`);
    $("#productModalIsbn").text(book.isbn || "-");

    const badgeHtml =
      stockQty > 0
        ? `<span class="badge badge-soft rounded-pill px-3 py-2">In Stock ${stockQty}</span>`
        : '<span class="badge bg-danger rounded-pill px-3 py-2">Out of Stock</span>';

    $("#productModalBadges").html(badgeHtml);

    if (images.length > 0) {
      const carouselItems = images
        .map((imagePath, index) => {
          return `
            <div class="carousel-item h-100 ${index === 0 ? "active" : ""}">
              <img src="${url}/${imagePath}" class="d-block w-100 h-100" style="object-fit: cover; min-height: 500px;" alt="${book.title || "Book image"}">
            </div>
          `;
        })
        .join("");

      $("#productCarouselInner").html(carouselItems);
      $("#productCarousel").removeClass("d-none");
    } else {
      $("#productCarouselInner").html(
        '<div class="carousel-item active h-100"><img src="https://via.placeholder.com/900x1200?text=No+Image" class="d-block w-100 h-100" style="object-fit: cover; min-height: 500px;" alt="No image available"></div>',
      );
      $("#productCarousel").removeClass("d-none");
    }

    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();
  }

  $.ajax({
    method: "GET",
    url: `${url}/api/v1/books`,
    dataType: "json",
    success: function (data) {
      allBooks = data.rows || [];
      renderBooks(allBooks);
    },
    error: function (error) {
      console.log("Error loading books:", error);
      $("#book-catalog").html(
        '<div class="col-12"><div class="empty-state text-center"><h3 class="h5 mb-2">Unable to load books</h3><p class="text-muted mb-0">Please try again later.</p></div></div>',
      );
    },
  });

  $("#searchBox").on("input", function () {
    renderBooks(allBooks);
  });

  $(document).on("click", ".viewBtn", function () {
    const id = $(this).data("id");
    const book = allBooks.find((item) => String(item.book_id) === String(id));

    if (book) {
      openProductModal(book);
    }
  });

  $(document).on("click", "#logoutBtn", function (e) {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "home.html";
  });
});
