$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;
  let categories = [];
  let searchQuery = "";

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

  const categoryModalElement = document.getElementById("categoryModal");
  const categoryModal =
    bootstrap.Modal.getOrCreateInstance(categoryModalElement);

  function escapeHtml(value) {
    return $("<div>")
      .text(value || "")
      .html();
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

  function renderCategoryRows() {
    const filteredCategories = categories.filter((category) => {
      const haystack =
        `${category.name || ""} ${category.description || ""}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });

    if (filteredCategories.length === 0) {
      $("#categoriesBody").html(
        '<tr><td colspan="4" class="text-center text-muted py-4">No categories found.</td></tr>',
      );
      return;
    }

    $("#categoriesBody").html(
      filteredCategories
        .map(
          (category) => `
            <tr data-id="${category.id}">
              <td>${category.id}</td>
              <td>${escapeHtml(category.name)}</td>
              <td>${category.description ? escapeHtml(category.description) : '<span class="text-muted">-</span>'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary editBtn" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${category.id}"><i class="fas fa-trash-alt"></i></button>
              </td>
            </tr>
          `,
        )
        .join(""),
    );
  }

  function refreshCategories() {
    $.ajax({
      method: "GET",
      url: `${url}/api/v1/categories`,
      dataType: "json",
      headers: { Authorization: "Bearer " + token },
      success: function (data) {
        categories = data.rows || [];
        renderCategoryRows();
      },
      error: function () {
        Swal.fire({ icon: "error", text: "Unable to load categories." });
      },
    });
  }

  $("#addCategoryBtn").on("click", function () {
    $("#categoryId").val("");
    $("#categoryForm").trigger("reset");
    clearValidationState($("#categoryForm"));
    $("#categoryUpdate").hide();
    $("#categorySubmit").show();
    categoryModal.show();
  });

  $("#categoriesTable tbody").on("click", ".editBtn", function () {
    const id = $(this).data("id");

    $.ajax({
      method: "GET",
      url: `${url}/api/v1/categories/${id}`,
      dataType: "json",
      headers: { Authorization: "Bearer " + token },
      success: function (data) {
        const category = data.result;
        $("#categoryId").val(category.id);
        $("#categoryName").val(category.name);
        $("#categoryDescription").val(category.description || "");
        $("#categoryUpdate").show();
        $("#categorySubmit").hide();
        categoryModal.show();
      },
      error: function () {
        Swal.fire({ icon: "error", text: "Unable to load category." });
      },
    });
  });

  $("#categoriesTable tbody").on("click", ".deleteBtn", function () {
    const id = $(this).data("id");

    Swal.fire({
      icon: "warning",
      title: "Delete category?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then((result) => {
      if (!result.isConfirmed) return;

      $.ajax({
        method: "DELETE",
        url: `${url}/api/v1/categories/${id}`,
        headers: { Authorization: "Bearer " + token },
        success: function () {
          refreshCategories();
          Swal.fire({
            icon: "success",
            text: "Category deleted successfully",
            timer: 1500,
          });
        },
        error: function (error) {
          Swal.fire({
            icon: "error",
            text: error.responseJSON?.error || "Unable to delete category",
          });
        },
      });
    });
  });

  $("#categoryForm").on("input change", ".required-field", function () {
    validateRequiredField($(this));
  });

  $("#categoryForm").on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const isUpdate = Boolean($("#categoryId").val());

    if (!validateRequiredFields($form)) {
      return Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in the required fields.",
      });
    }

    $.ajax({
      method: isUpdate ? "PUT" : "POST",
      url: isUpdate
        ? `${url}/api/v1/categories/${$("#categoryId").val()}`
        : `${url}/api/v1/categories`,
      data: JSON.stringify({
        name: $("#categoryName").val(),
        description: $("#categoryDescription").val(),
      }),
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      success: function () {
        categoryModal.hide();
        refreshCategories();
        Swal.fire({
          icon: "success",
          title: isUpdate ? "Updated!" : "Added!",
          text: isUpdate
            ? "Category updated successfully."
            : "Category created successfully.",
          timer: 1500,
        });
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text:
            error.responseJSON?.error ||
            (isUpdate ? "Error updating category" : "Error creating category"),
        });
      },
    });
  });

  $(".admin-search").on("input", function () {
    searchQuery = $(this).val().trim();
    renderCategoryRows();
  });

  refreshCategories();
});
