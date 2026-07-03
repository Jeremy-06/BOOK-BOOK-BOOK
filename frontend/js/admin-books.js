$(document).ready(function () {
  const url = "http://localhost:3000";

  // 1. Security Check: Admin lang pwede rito!
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

  // 2. Initialize DataTable
  $("#btable").DataTable({
    ajax: {
      url: `${url}/api/v1/books`,
      dataSrc: "rows",
    },
    dom: '<"row"<"col-sm-12 col-md-6"B><"col-sm-12 col-md-6"f>>rtip',
    buttons: [
      {
        text: '<i class="fas fa-plus"></i> Add Book',
        className: "btn btn-primary btn-sm ms-2",
        action: function () {
          $("#bform").trigger("reset");
          $("#bookModal").modal("show");
          $("#bookUpdate").hide();
          $("#bookSubmit").show();
          $("#bookImagePreview").remove();
        },
      },
    ],
    columns: [
      { data: "book_id" },
      {
        data: null,
        render: function (data) {
          let images = [];

          try {
            images = data.img_path ? JSON.parse(data.img_path) : [];
          } catch (error) {
            images = data.img_path ? [data.img_path] : [];
          }

          return images.length > 0
            ? `<img src="${url}/${images[0]}" width="40" height="50" class="rounded">`
            : '<span class="badge bg-secondary">No Image</span>';
        },
      },
      { data: "title" },
      { data: "author" },
      {
        data: "price",
        render: function (data) {
          return `₱${data}`;
        },
      },
      { data: "isbn" },
      {
        data: null,
        render: function (data) {
          let qty = data.Stock ? data.Stock.quantity : 0;
          return qty > 0
            ? `<span class="badge bg-success">${qty}</span>`
            : `<span class="badge bg-danger">Out of Stock</span>`;
        },
      },
      {
        data: null,
        render: function (data) {
          return `<button class="btn btn-sm btn-outline-primary editBtn" data-id="${data.book_id}"><i class="fas fa-edit"></i></button> 
                            <button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${data.book_id}"><i class="fas fa-trash-alt"></i></button>`;
        },
      },
    ],
  });

  // 3. Create Book (Submit)
  $("#bookSubmit").on("click", function (e) {
    e.preventDefault();
    let formData = new FormData($("#bform")[0]);

    $.ajax({
      method: "POST",
      url: `${url}/api/v1/books`,
      data: formData,
      contentType: false,
      processData: false,
      success: function () {
        $("#bookModal").modal("hide");
        $("#btable").DataTable().ajax.reload();
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Book created successfully.",
          timer: 1500,
        });
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text: error.responseJSON?.error || "An error occurred",
        });
      },
    });
  });

  // 4. Edit Book (Get Data and Show Modal)
  $("#btable tbody").on("click", ".editBtn", function (e) {
    e.preventDefault();
    $("#bookImagePreview").remove();
    $("#bookId").remove();
    $("#bform").trigger("reset");

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

        if (book.img_path) {
          let images = [];

          try {
            images = JSON.parse(book.img_path);
          } catch (error) {
            images = [book.img_path];
          }

          $("#bform").append(
            `<div id="bookImagePreview" class="mt-3"><img src="${url}/${images[0]}" width="100" class="rounded border"/></div>`,
          );
        }
      },
    });
  });

  // 5. Update Book
  $("#bookUpdate").on("click", function (e) {
    e.preventDefault();
    const id = $("#bookId").val();
    let formData = new FormData($("#bform")[0]);

    $.ajax({
      method: "PUT",
      url: `${url}/api/v1/books/${id}`,
      data: formData,
      contentType: false,
      processData: false,
      success: function () {
        $("#bookModal").modal("hide");
        $("#btable").DataTable().ajax.reload();
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Book updated successfully.",
          timer: 1500,
        });
      },
    });
  });

  // 6. Delete Book
  $("#btable tbody").on("click", ".deleteBtn", function (e) {
    e.preventDefault();
    const id = $(this).data("id");
    const $row = $(this).closest("tr");

    bootbox.confirm(
      "Are you sure you want to delete this book?",
      function (result) {
        if (result) {
          $.ajax({
            method: "DELETE",
            url: `${url}/api/v1/books/${id}`,
            success: function () {
              $row.fadeOut(500, function () {
                $("#btable").DataTable().row($row).remove().draw();
              });
              Swal.fire({ icon: "success", text: "Book deleted", timer: 1500 });
            },
          });
        }
      },
    );
  });
});
