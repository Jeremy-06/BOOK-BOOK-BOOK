$(document).ready(function () {
  //const url = "http://localhost:3000";
  const url = `http://${window.location.hostname}:3000`;
  const rawToken = sessionStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/"/g, "") : null;
  const sessionFirstName = sessionStorage.getItem("userFirstName") || "";
  const sessionLastName = sessionStorage.getItem("userLastName") || "";
  const sessionEmail = sessionStorage.getItem("userEmail") || "-";

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const authHeaders = { Authorization: "Bearer " + token };
  let allOrders = [];

  function parsePrice(price) {
    const value = Number(price);
    return Number.isFinite(value) ? value : 0;
  }

  function formatMoney(amount) {
    return `₱${parsePrice(amount).toFixed(2)}`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "-";
    return new Date(dateValue).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function displayValue(value) {
    return value ? value : "-";
  }

  function getProfileUser(data) {
    return data.user || data.result || data;
  }

  function getFullName(user) {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
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

  function updateProfileDisplay(user) {
    const customer = user.Customer || user.customer || {};
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const phone = customer.phone || "";
    const zipCode = customer.zip_code || "";
    const address = customer.address || "";

    $("#profileName").text(getFullName(user) || `${sessionFirstName} ${sessionLastName}`.trim() || "-");
    $("#profileEmail").text(user.email || sessionEmail);
    $("#profileFirstName").text(displayValue(firstName));
    $("#profileLastName").text(displayValue(lastName));
    $("#profilePhone").text(displayValue(phone));
    $("#profileZipcode").text(displayValue(zipCode));
    $("#profileAddress").text(displayValue(address));

    $("#editFirstName").val(firstName);
    $("#editLastName").val(lastName);
    $("#editPhone").val(phone);
    $("#editZipCode").val(zipCode);
    $("#editAddress").val(address);

  }

  function getOrderLines(order) {
    return order.OrderLines || order.orderlines || order.order_lines || [];
  }

  function getOrderTotal(order) {
    const itemsTotal = getOrderLines(order).reduce((sum, item) => {
      return sum + parsePrice(item.price) * parsePrice(item.quantity);
    }, 0);
    return itemsTotal + parsePrice(order.shipping_fee || 100);
  }

  function getStatusBadge(status) {
    let badgeClass = "bg-secondary";
    if (status === "Processing") badgeClass = "bg-primary";
    if (status === "Shipped") badgeClass = "bg-info";
    if (status === "Delivered") badgeClass = "bg-success";
    if (status === "Cancelled") badgeClass = "bg-danger";
    return `<span class="badge ${badgeClass}">${status || "Processing"}</span>`;
  }

  function renderOrders(orders) {
    if (!orders || orders.length === 0) {
      $("#ordersTableBody").html(`
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            You do not have any orders yet.
          </td>
        </tr>
      `);
      return;
    }

    const html = orders
      .map((order) => {
        return `
          <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${formatDate(order.date_placed)}</td>
            <td>${formatMoney(getOrderTotal(order))}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-dark viewOrderBtn" data-id="${order.id}">
                <i class="fas fa-eye me-1"></i>View Details
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    $("#ordersTableBody").html(html);
  }

  function loadProfile() {
    $.ajax({
      method: "GET",
      url: `${url}/api/v1/users/profile`,
      dataType: "json",
      headers: authHeaders,
      success: function (data) {
        updateProfileDisplay(getProfileUser(data));
      },
      error: function () {
        $("#profileName").text(`${sessionFirstName} ${sessionLastName}`.trim() || "-");
        $("#profileEmail").text(sessionEmail);
        Swal.fire({
          icon: "warning",
          text: "Profile details could not be loaded. Showing your account info instead.",
        });
      },
    });
  }

  function loadOrders() {
    $.ajax({
      method: "GET",
      url: `${url}/api/v1/orders/me`,
      dataType: "json",
      headers: authHeaders,
      success: function (data) {
        allOrders = Array.isArray(data) ? data : data.rows || data.orders || [];
        renderOrders(allOrders);
      },
      error: function (error) {
        $("#ordersTableBody").html(`
          <tr>
            <td colspan="5" class="text-center text-danger py-4">
              Unable to load your orders.
            </td>
          </tr>
        `);
        Swal.fire({
          icon: "error",
          text: error.responseJSON && error.responseJSON.message ? error.responseJSON.message : "Unable to load your orders.",
        });
      },
    });
  }

  $("#editProfileForm").on("submit", function (e) {
    e.preventDefault();

    if (!validateRequiredFields($(this))) {
      return Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields highlighted in red.",
      });
    }

    const profileData = {
      first_name: $("#editFirstName").val(),
      last_name: $("#editLastName").val(),
      phone: $("#editPhone").val(),
      zip_code: $("#editZipCode").val(),
      address: $("#editAddress").val(),
    };

    $("#saveProfileBtn").prop("disabled", true).text("Saving...");

    $.ajax({
      method: "PUT",
      url: `${url}/api/v1/users/profile`,
      data: JSON.stringify(profileData),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      headers: authHeaders,
      success: function (data) {
        const modal = bootstrap.Modal.getOrCreateInstance(
          document.getElementById("editProfileModal"),
        );
        modal.hide();

        if (data.user) {
          updateProfileDisplay(data.user);
        }

        Swal.fire({
          icon: "success",
          text: data.message || "Profile updated successfully",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });

        loadProfile();
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text: error.responseJSON && error.responseJSON.error ? error.responseJSON.error : "Unable to update profile.",
        });
      },
      complete: function () {
        $("#saveProfileBtn").prop("disabled", false).text("Save Changes");
      },
    });
  });

  $("#editProfileForm").on("input change", ".required-field", function () {
    validateRequiredField($(this));
  });

  $("#editProfileModal").on("show.bs.modal", function () {
    clearValidationState($("#editProfileForm"));
  });

  $(document).on("click", ".viewOrderBtn", function () {
    const orderId = $(this).data("id");
    const order = allOrders.find((item) => String(item.id) === String(orderId));

    if (!order) {
      return;
    }

    let itemsHtml = "";
    let itemsTotal = 0;

    const orderLines = getOrderLines(order);

    if (orderLines.length > 0) {
      orderLines.forEach((item) => {
        const subtotal = parsePrice(item.price) * parsePrice(item.quantity);
        itemsTotal += subtotal;
        itemsHtml += `
          <tr>
            <td>${item.Book ? item.Book.title : "Unknown Book"}</td>
            <td>${item.quantity}</td>
            <td>${formatMoney(item.price)}</td>
            <td class="text-end">${formatMoney(subtotal)}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml = '<tr><td colspan="4" class="text-center text-muted">No items found</td></tr>';
    }

    const shippingFee = parsePrice(order.shipping_fee || 100);

    $("#modalOrderId").text(order.id);
    $("#modalDatePlaced").text(formatDate(order.date_placed));
    $("#modalStatus").html(getStatusBadge(order.status));
    $("#modalPaymentMethod").text(order.payment_method || "-");
    $("#modalOrderItems").html(itemsHtml);
    $("#modalShippingFee").text(formatMoney(shippingFee));
    $("#modalOrderTotal").text(formatMoney(itemsTotal + shippingFee));

    const modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("orderDetailsModal"),
    );
    modal.show();
  });

  $(document).on("click", "#logoutBtn", function (e) {
    e.preventDefault();

    Swal.fire({
      icon: "warning",
      title: "Ready to Leave?",
      text: "Are you sure you want to logout?",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
      }
    });
  });

  loadProfile();
  loadOrders();
});
