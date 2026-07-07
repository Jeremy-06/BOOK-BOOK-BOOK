$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;

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

  const authHeaders = { Authorization: `Bearer ${token}` };

  const reactivateModalElement = document.getElementById("reactivateModal");
  const reactivateModal = bootstrap.Modal.getOrCreateInstance(
    reactivateModalElement,
  );

  // Escape value
  function escapeHtml(value) {
    return $("<div>")
      .text(value || "")
      .html();
  }

  // Full name
  function getFullName(user) {
    return (
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      "Unknown User"
    );
  }

  // Role badge
  function renderRoleBadge(role) {
    return role === "admin"
      ? '<span class="badge bg-danger">Admin</span>'
      : '<span class="badge bg-primary">User</span>';
  }

  // Status badge
  function renderStatusBadge(deletedAt) {
    return deletedAt === null
      ? '<span class="badge bg-success">Active</span>'
      : '<span class="badge bg-secondary">Deactivated</span>';
  }

  // Action buttons
  function renderActions(user) {
    const roleBtn = `<button class="btn btn-sm btn-outline-primary editRoleBtn" data-id="${user.id}" data-role="${escapeHtml(user.role)}"><i class="fas fa-user-edit"></i> Role</button>`;
    const statusBtn =
      user.deleted_at === null
        ? `<button class="btn btn-sm btn-outline-danger deactivateBtn" data-email="${escapeHtml(user.email)}"><i class="fas fa-ban"></i> Deactivate</button>`
        : `<button class="btn btn-sm btn-outline-success reactivateBtn" data-email="${escapeHtml(user.email)}"><i class="fas fa-redo-alt"></i> Reactivate</button>`;

    return `${roleBtn} ${statusBtn}`;
  }

  // Init table
  const usersTable = $("#usersTable").DataTable({
    serverSide: true,
    processing: true,
    searching: true,
    order: [[0, "desc"]],
    ajax: {
      url: `${url}/api/v1/users`,
      headers: authHeaders,
      dataSrc: "data",
      error: function () {
        Swal.fire({ icon: "error", text: "Unable to load users." });
      },
    },
    columns: [
      { data: "id", name: "id" },
      {
        data: null,
        name: "first_name",
        render: function (user) {
          return escapeHtml(getFullName(user));
        },
      },
      {
        data: "email",
        name: "email",
        render: function (email) {
          return escapeHtml(email);
        },
      },
      {
        data: "role",
        name: "role",
        render: function (role) {
          return renderRoleBadge(role);
        },
      },
      {
        data: "deleted_at",
        name: "deleted_at",
        render: function (deletedAt) {
          return renderStatusBadge(deletedAt);
        },
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (user) {
          return renderActions(user);
        },
      },
    ],
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
      headers: authHeaders,
      data: JSON.stringify({ role }),
      contentType: "application/json",
      success: function () {
        $("#roleModal").modal("hide");
        usersTable.ajax.reload(null, false);
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
          headers: authHeaders,
          data: JSON.stringify({ email }),
          contentType: "application/json",
          success: function () {
            usersTable.ajax.reload(null, false);
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
      headers: authHeaders,
      data: JSON.stringify({ email }),
      contentType: "application/json",
      success: function () {
        reactivateModal.hide();
        usersTable.ajax.reload(null, false);
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
});