// Home page script
$(document).ready(function () {
    const url = 'http://localhost:3000';

    // 1. Check if logged in
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('role');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Role-Based Access Control (Admin Dashboard Link)
    if (userRole === 'admin') {
        $('#nav-links').prepend('<li class="nav-item"><a class="nav-link text-warning fw-bold" href="admin/books.html"><i class="fas fa-cogs"></i> Admin Dashboard</a></li>');
    }

    // 3. Fetch all books and display as shop cards
    $.ajax({
        method: "GET",
        url: `${url}/api/v1/books`,
        dataType: "json",
        success: function (data) {
            const books = data.rows; // Base sa backend na ginawa natin, nasa 'rows' ang data
            let html = '';

            books.forEach(book => {
                const imageSrc = book.img_path ? `${url}/${book.img_path}` : 'https://via.placeholder.com/150?text=No+Image';
                const stockQty = book.Stock ? book.Stock.quantity : 0;
                const stockBadge = stockQty > 0 
                    ? `<span class="badge bg-success">In Stock (${stockQty})</span>` 
                    : `<span class="badge bg-danger">Out of Stock</span>`;

                html += `
                    <div class="col-md-3 mb-4">
                        <div class="card book-card h-100">
                            <img src="${imageSrc}" class="card-img-top book-cover" alt="Book Cover">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${book.title}</h5>
                                <p class="card-text text-muted small mb-2">by ${book.author}</p>
                                ${stockBadge}
                                <div class="mt-auto pt-3 d-flex justify-content-between align-items-center">
                                    <span class="price-tag">₱${book.price}</span>
                                    <button class="btn btn-sm btn-outline-primary" ${stockQty === 0 ? 'disabled' : ''}>
                                        <i class="fas fa-cart-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            $('#book-catalog').html(html);
        },
        error: function (error) {
            console.log("Error loading books:", error);
        }
    });

    // 4. Logout Function
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});