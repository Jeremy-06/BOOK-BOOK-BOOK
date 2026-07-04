$(document).ready(function () {
  //const url = "http://localhost:3000";
  const url = `http://${window.location.hostname}:3000`;
  const cartKey = "bookShopCart";
  const rawToken = sessionStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/"/g, "") : null;
  const rawRole = sessionStorage.getItem("role");
  const userRole = rawRole ? rawRole.replace(/"/g, "") : null;

  if (token && userRole === "admin") {
    $("#nav-links").prepend(
      `<li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle text-warning fw-bold" href="#" id="adminPanelDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fas fa-cogs me-1"></i>Admin Panel
        </a>
        <ul class="dropdown-menu" aria-labelledby="adminPanelDropdown">
          <li><a class="dropdown-item" href="admin/books.html">Manage Books</a></li>
          <li><a class="dropdown-item" href="admin/orders.html">Manage Orders</a></li>
          <li><a class="dropdown-item" href="admin/users.html">Manage Users</a></li>
        </ul>
      </li>`,
    );
    $("#loginLink")
      .closest(".nav-item")
      .after(
        '<li class="nav-item"><a class="nav-link" href="profile.html" id="profileLink"><i class="fas fa-user me-1"></i>My Profile & Orders</a></li><li class="nav-item"><a href="#" class="nav-link" id="logoutBtn">Logout</a></li>',
      );
    $("#ctaLogin").text("My Profile & Orders").attr("href", "profile.html");
    $("#loginLink").closest(".nav-item").remove();
  } else if (token) {
    $("#loginLink")
      .closest(".nav-item")
      .after(
        '<li class="nav-item"><a class="nav-link" href="profile.html" id="profileLink"><i class="fas fa-user me-1"></i>My Profile & Orders</a></li><li class="nav-item"><a href="#" class="nav-link" id="logoutBtn">Logout</a></li>',
      );
    $("#ctaLogin").text("My Profile & Orders").attr("href", "profile.html");
    $("#loginLink").closest(".nav-item").remove();
  }

  let allBooks = [];
  let checkoutCart = [];
  let checkoutSelectedItems = [];

  function getCart() {
    try {
      const storedCart = localStorage.getItem(cartKey);
      const parsedCart = storedCart ? JSON.parse(storedCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartUI();
  }

  function parsePrice(price) {
    const value = Number(price);
    return Number.isFinite(value) ? value : 0;
  }

  function getCurrentToken() {
    const rawToken = sessionStorage.getItem("token");
    return rawToken ? rawToken.replace(/"/g, "") : null;
  }

  function getCartCount(cart) {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  function getCartTotal(cart) {
    return cart.reduce((total, item) => {
      if (item.isSelected === false) return total;
      return total + item.quantity * parsePrice(item.price);
    }, 0);
  }

  function updateCartBadge() {
    const cart = getCart();
    $("#cartCount").text(getCartCount(cart));
  }

  function renderCart() {
    const cart = getCart();
    const cartItems = $("#cartItems");
    const emptyState = $("#cartEmptyState");
    const total = $("#cartTotal");

    if (cart.length === 0) {
      cartItems.html("");
      emptyState.removeClass("d-none");
      total.text("₱0.00");
      updateCartBadge();
      return;
    }

    emptyState.addClass("d-none");

    const html = cart
      .map((item) => {
        // Check kung naka-select ang item (true by default)
        const checkedAttr = item.isSelected !== false ? "checked" : "";

        return `
        <div class="card border-0 shadow-sm">
          <div class="card-body d-flex gap-3 align-items-center">
            <div class="form-check">
              <input class="form-check-input select-cart-item" type="checkbox" data-id="${item.id}" ${checkedAttr} style="transform: scale(1.5); cursor: pointer;">
            </div>
            
            <img src="${item.image}" alt="${item.title}" width="70" height="95" style="object-fit: cover; border-radius: 12px;">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between gap-2">
                <div>
                  <h6 class="mb-1">${item.title}</h6>
                  <p class="mb-1 text-muted small">by ${item.author}</p>
                </div>
                <button class="btn btn-sm btn-link text-danger removeCartItemBtn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
              </div>
              <div class="d-flex justify-content-between align-items-center mt-2">
                <div class="btn-group btn-group-sm" role="group">
                  <button class="btn btn-outline-secondary decreaseQtyBtn" data-id="${item.id}">-</button>
                  <button class="btn btn-outline-secondary disabled">${item.quantity}</button>
                  <button class="btn btn-outline-secondary increaseQtyBtn" data-id="${item.id}" data-stock="${item.stockQty}">+</button>
                </div>
                <div class="text-end">
                  <div class="fw-semibold">₱${parsePrice(item.price).toFixed(2)}</div>
                  <div class="small text-muted">Subtotal ₱${(parsePrice(item.price) * item.quantity).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    cartItems.html(html);
    total.text(`₱${getCartTotal(cart).toFixed(2)}`);
    updateCartBadge();
  }

  function updateCartUI() {
    updateCartBadge();
    renderCart();
  }

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

  function getImageSrc(imagePath, fallbackSrc) {
    if (!imagePath) {
      return fallbackSrc;
    }

    return /^https?:\/\//i.test(imagePath) ? imagePath : `${url}/${imagePath}`;
  }

  function getMainCoverPath(book) {
    if (Array.isArray(book.BookImages) && book.BookImages.length > 0) {
      return book.BookImages[0].image_path || book.BookImages[0].url || "";
    }

    const images = parseImages(book.img_path);
    return images.length > 0 ? images[0] : "";
  }

  function getMainCoverSrc(book, fallbackSrc) {
    return getImageSrc(getMainCoverPath(book), fallbackSrc);
  }

  function addToCart(bookId) {
    const book = allBooks.find(
      (item) => String(item.book_id) === String(bookId),
    );

    if (!book) {
      return;
    }

    const stockQty = book.Stock ? book.Stock.quantity : 0;
    if (stockQty <= 0) {
      Swal.fire({ icon: "error", text: "This item is out of stock." });
      return;
    }

    const cart = getCart();
    const existingItem = cart.find(
      (item) => String(item.id) === String(book.book_id),
    );
    const imageSrc = getMainCoverSrc(
      book,
      "https://via.placeholder.com/600x800?text=No+Image",
    );

    if (existingItem) {
      if (existingItem.quantity >= stockQty) {
        Swal.fire({
          icon: "info",
          text: "You already added the maximum available stock.",
        });
        return;
      }

      existingItem.quantity += 1;
      existingItem.isSelected = true;
    } else {
      cart.push({
        id: book.book_id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: imageSrc,
        quantity: 1,
        stockQty,
        isSelected: true,
      });
    }

    saveCart(cart);
    Swal.fire({
      icon: "success",
      title: "Added to Cart",
      timer: 1500,
      showConfirmButton: false,
    });
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
      const imageSrc = getMainCoverSrc(
        book,
        "https://via.placeholder.com/600x800?text=No+Image",
      );
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
                              <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-dark viewBtn" data-id="${book.book_id}">
                                  <i class="fas fa-eye me-1"></i>View
                                </button>
                                <button class="btn btn-sm btn-dark addCartBtn" data-id="${book.book_id}" ${stockQty === 0 ? "disabled" : ""}>
                                  <i class="fas fa-cart-plus me-1"></i>Add
                                </button>
                              </div>
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

  $(document).on("click", ".addCartBtn", function () {
    const id = $(this).data("id");
    addToCart(id);
  });

  $(document).on("click", "#viewCartBtn", function () {
    renderCart();
    const cartCanvas = bootstrap.Offcanvas.getOrCreateInstance(
      document.getElementById("cartCanvas"),
    );
    cartCanvas.show();
  });

  $(document).on("click", ".removeCartItemBtn", function () {
    const id = $(this).data("id");
    const cart = getCart().filter((item) => String(item.id) !== String(id));
    saveCart(cart);
  });

  $(document).on("click", ".increaseQtyBtn", function () {
    const id = $(this).data("id");
    const stockQty = Number($(this).data("stock"));
    const cart = getCart();
    const item = cart.find((entry) => String(entry.id) === String(id));

    if (!item || item.quantity >= stockQty) {
      return;
    }

    item.quantity += 1;
    saveCart(cart);
  });

  $(document).on("click", ".decreaseQtyBtn", function () {
    const id = $(this).data("id");
    const cart = getCart();
    const item = cart.find((entry) => String(entry.id) === String(id));

    if (!item) {
      return;
    }

    item.quantity -= 1;
    const updatedCart =
      item.quantity <= 0
        ? cart.filter((entry) => String(entry.id) !== String(id))
        : cart;
    saveCart(updatedCart);
  });

  $(document).on("click", "#clearCartBtn", function () {
    localStorage.removeItem(cartKey);
    updateCartUI();
  });

  $(document).on("click", "#logoutBtn", function (e) {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "home.html";
  });

  $(document).on("click", "#checkoutBtn", function (e) {
    e.preventDefault(); // Pinipigilan ang page na mag-refresh
    console.log("1. Checkout button was clicked!"); // DEBUGGER

    const cart = getCart();
    console.log("2. Current Cart:", cart); // DEBUGGER

    // Kunin lang ang mga naka-check
    const selectedItems = cart.filter(item => item.isSelected !== false);
    console.log("3. Selected Items for checkout:", selectedItems); // DEBUGGER

    if (selectedItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Cart is empty",
        text: "Please select at least one item to checkout.",
      });
      return;
    }

    const currentToken = getCurrentToken();
    if (!currentToken) {
      Swal.fire({
        icon: "info",
        title: "Login Required",
        text: "Please login to proceed with your checkout.",
        showCancelButton: true,
        confirmButtonText: "Go to Login",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "login.html";
        }
      });
      return;
    }

    checkoutCart = cart;
    checkoutSelectedItems = selectedItems;
    $("#paymentTotalAmount").text(`₱${getCartTotal(selectedItems).toFixed(2)}`);
    $("#paymentMethod").val("Cash on Delivery");

    const paymentModal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("paymentModal"),
    );
    paymentModal.show();
  });

  $(document).on("click", "#confirmPaymentBtn", function (e) {
    e.preventDefault();

    const selectedItems = checkoutSelectedItems;
    const cart = checkoutCart;
    const paymentMethod = "Cash on Delivery";

    if (selectedItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Cart is empty",
        text: "Please select at least one item to checkout.",
      });
      return;
    }

    const currentToken = getCurrentToken();
    if (!currentToken) {
      Swal.fire({
        icon: "info",
        title: "Login Required",
        text: "Please login to proceed with your checkout.",
        showCancelButton: true,
        confirmButtonText: "Go to Login",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "login.html";
        }
      });
      return;
    }

    // I-format para sa backend
    const formattedCart = selectedItems.map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
      price: parsePrice(item.price),
    }));

    const payload = JSON.stringify({ cart: formattedCart, payment_method: paymentMethod });
    const btn = $(this);

    console.log("4. Sending payload to backend:", payload); // DEBUGGER

    btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin me-2"></i>Processing...');

    $.ajax({
      type: "POST",
      url: `${url}/api/v1/orders/checkout`,
      data: payload,
      dataType: "json",
      processData: false,
      contentType: "application/json; charset=utf-8",
      headers: {
        Authorization: "Bearer " + currentToken,
      },
      success: function (data) {
        console.log("5. Success response from backend:", data); // DEBUGGER
        const paymentModalEl = document.getElementById("paymentModal");
        const paymentModal = bootstrap.Modal.getInstance(paymentModalEl);
        if (paymentModal) paymentModal.hide();

        Swal.fire({
          icon: "success",
          title: "Order Placed!",
          text: "Your order has been successfully placed via COD.",
          timer: 2000,
        }).then(() => {
          // Itira sa cart ang mga hindi naka-select
          const remainingItems = cart.filter(item => item.isSelected === false);
          localStorage.setItem(cartKey, JSON.stringify(remainingItems));
          
          updateCartUI();
          btn.prop("disabled", false).html('<i class="fas fa-credit-card me-2"></i>Confirm Payment & Place Order');

          const cartCanvasEl = document.getElementById("cartCanvas");
          if (cartCanvasEl) {
            const cartCanvas = bootstrap.Offcanvas.getInstance(cartCanvasEl);
            if (cartCanvas) cartCanvas.hide();
          }

          // I-refresh ang books data
          $.ajax({
            method: "GET",
            url: `${url}/api/v1/books`,
            dataType: "json",
            success: function (bookData) {
              allBooks = bookData.rows || [];
              renderBooks(allBooks);
            }
          });
        });
      },
      error: function (error) {
        console.error("5. Error response from backend:", error); // DEBUGGER
        btn.prop("disabled", false).html('<i class="fas fa-credit-card me-2"></i>Confirm Payment & Place Order');

        const responseError = error.responseJSON && error.responseJSON.error;
        const isIncompleteProfile =
          responseError === "IncompleteProfile" || error.status === 403;

        if (isIncompleteProfile) {
          Swal.fire({
            icon: "error",
            title: "Profile Incomplete",
            text: "Please update your address and phone number before ordering.",
          }).then(() => {
            window.location.href = "profile.html";
          });
          return;
        }

        Swal.fire({
          icon: "error",
          title: "Checkout Failed",
          text: responseError || "Transaction failed. Please try again.",
        });
      },
    });
  });
  
  // Kapag pinindot ang checkbox sa cart
  $(document).on("change", ".select-cart-item", function () {
    const id = $(this).data("id");
    const isChecked = $(this).is(":checked");
    const cart = getCart();

    const item = cart.find((entry) => String(entry.id) === String(id));
    if (item) {
      item.isSelected = isChecked;
      saveCart(cart); // Magre-recompute ng total automatically
    }
  });

  updateCartUI();
});
