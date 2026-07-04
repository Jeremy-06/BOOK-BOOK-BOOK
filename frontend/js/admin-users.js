$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;
  const limit = 25;
  let currentPage = 1;
  let isFetching = false;
  let hasMoreUsers = true;
  let currentSortBy = "id";
  let currentSortOrder = "DESC";
  let searchQuery = "";
  let searchDebounceTimer = null;

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

  const reactivateModalElement = document.getElementById("reactivateModal");
  const reactivateModal = bootstrap.Modal.getOrCreateInstance(
    reactivateModalElement,
  );

  function escapeHtml(value) {
    return $("<div>").text(value || "").html();
  }

  function getFullName(user) {
    return (
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      "Unknown User"
    );
  }

  function renderUserRow(user) {
    const roleBadge =
      user.role === "admin"
        ? '<span class="badge bg-danger">Admin</span>'
        : '<span class="badge bg-primary">User</span>';
    const statusBadge =
      user.deleted_at === null
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-secondary">Deactivated</span>';
    const actionButton =
      user.deleted_at === null
        ? `<button class="btn btn-sm btn-outline-danger deactivateBtn" data-email="${escapeHtml(user.email)}"><i class="fas fa-ban"></i> Deactivate</button>`
        : `<button class="btn btn-sm btn-outline-success reactivateBtn" data-email="${escapeHtml(user.email)}"><i class="fas fa-redo-alt"></i> Reactivate</button>`;

    return `
      <tr data-id="${user.id}">
        <td>${user.id}</td>
        <td>${escapeHtml(getFullName(user))}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary editRoleBtn" data-id="${user.id}" data-role="${escapeHtml(user.role)}"><i class="fas fa-user-edit"></i> Role</button>
          ${actionButton}
        </td>
      </tr>
    `;
  }

  function fetchUsers() {
    if (isFetching || !hasMoreUsers) return;

    isFetching = true;

    $.ajax({
      method: "GET",
      url: `${url}/api/v1/users?page=${currentPage}&limit=${limit}&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}&search=${encodeURIComponent(searchQuery)}`,
      dataType: "json",
      success: function (data) {
        const users = data.rows || [];

        if (currentPage === 1 && users.length === 0) {
          $("#usersTable tbody").html(
            '<tr><td colspan="6" class="text-center text-muted py-4">No users found.</td></tr>',
          );
        } else {
          $("#usersTable tbody").append(users.map(renderUserRow).join(""));
        }

        hasMoreUsers = Boolean(data.hasMore);
        currentPage += 1;
      },
      error: function () {
        Swal.fire({ icon: "error", text: "Unable to load users." });
      },
      complete: function () {
        isFetching = false;
      },
    });
  }

  function refreshUsers() {
    currentPage = 1;
    hasMoreUsers = true;
    isFetching = false;
    $("#usersTable tbody").empty();
    fetchUsers();
  }

  $(".custom-table-scroll").on("scroll", function () {
    if (
      Math.ceil($(this).scrollTop() + $(this).innerHeight()) >=
      $(this)[0].scrollHeight - 5
    ) {
      fetchUsers();
    }
  });

  $("#usersTable").on("click", "th.sortable", function () {
    const sortBy = $(this).data("sort");

    if (currentSortBy === sortBy) {
      currentSortOrder = currentSortOrder === "ASC" ? "DESC" : "ASC";
    } else {
      currentSortBy = sortBy;
      currentSortOrder = "ASC";
    }

    currentPage = 1;
    hasMoreUsers = true;
    isFetching = false;
    $("#usersTable tbody").empty();
    fetchUsers();
  });

  $(".admin-search").on("input", function () {
    clearTimeout(searchDebounceTimer);
    searchQuery = $(this).val().trim();

    searchDebounceTimer = setTimeout(function () {
      refreshUsers();
    }, 300);
  });

  $("#usersTable tbody").on("click", ".editRoleBtn", function () {
    const id = $(this).data("id");
    const role = $(this).data("role");

    $("#editUserId").val(id);
    $("#userRole").val(role);
    $("#roleModal").modal("show");
  });

  $("#saveRoleBtn").on("click", function () {
    const id = $("#editUserId").val();
    const role = $("#userRole").val();

    $.ajax({
      method: "PUT",
      url: `${url}/api/v1/users/${id}/role`,
      data: JSON.stringify({ role }),
      contentType: "application/json",
      success: function () {
        $("#roleModal").modal("hide");
        refreshUsers();
        Swal.fire({
          icon: "success",
          text: "Role updated successfully",
          timer: 1500,
        });
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text: error.responseJSON?.error || "Unable to update role",
        });
      },
    });
  });

  $("#usersTable tbody").on("click", ".deactivateBtn", function () {
    const email = $(this).data("email");

    bootbox.confirm(
      "Are you sure you want to deactivate this user?",
      function (result) {
        if (!result) return;

        $.ajax({
          method: "DELETE",
          url: `${url}/api/v1/users/deactivate`,
          data: JSON.stringify({ email }),
          contentType: "application/json",
          success: function () {
            refreshUsers();
            Swal.fire({
              icon: "success",
              text: "User deactivated",
              timer: 1500,
            });
          },
          error: function (error) {
            Swal.fire({
              icon: "error",
              text: error.responseJSON?.error || "Unable to deactivate user",
            });
          },
        });
      },
    );
  });

  $("#usersTable tbody").on("click", ".reactivateBtn", function () {
    const email = $(this).data("email");
    $("#reactivateUserEmail").val(email);
    reactivateModal.show();
  });

  $("#confirmReactivateBtn").on("click", function () {
    const email = $("#reactivateUserEmail").val();

    if (!email) return;

    $.ajax({
      method: "PUT",
      url: `${url}/api/v1/users/reactivate`,
      data: JSON.stringify({ email }),
      contentType: "application/json",
      success: function () {
        reactivateModal.hide();
        refreshUsers();
        Swal.fire({
          icon: "success",
          text: "User reactivated",
          timer: 1500,
        });
      },
      error: function (error) {
        reactivateModal.hide();
        Swal.fire({
          icon: "error",
          text: error.responseJSON?.error || "Unable to reactivate user",
        });
      },
    });
  });

  refreshUsers();
});
