$(document).ready(function () {
  const url = "http://localhost:3000";
  const rawToken = sessionStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/"/g, "") : null;
  const userIdRaw = sessionStorage.getItem("userId");
  const sessionName = sessionStorage.getItem("userName") || "-";
  const sessionEmail = sessionStorage.getItem("userEmail") || "-";

  if (!token || !userIdRaw) {
    window.location.href = "login.html";
    return;
  }

  let userId = userIdRaw;
  let allOrders = [];

  try {
    userId = JSON.parse(userIdRaw);
  } catch (error) {
    userId = userIdRaw;
  }

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

  function getOrderTotal(order) {
    const itemsTotal = order.OrderLines
      ? order.OrderLines.reduce((sum, item) => {
          return sum + parsePrice(item.price) * item.quantity;
        }, 0)
      : 0;
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
      url: `${url}/api/v1/users/profile/${userId}`,
      dataType: "json",
      success: function (data) {
        const user = data.result || data.user || data;
        const customer = user.Customer || user.customer || {};

        $("#profileName").text(user.name || sessionName);
        $("#profileEmail").text(user.email || sessionEmail);
        $("#profileFirstName").text(customer.fname || "-");
        $("#profileLastName").text(customer.lname || "-");
        $("#profilePhone").text(customer.phone || "-");
        $("#profileZipcode").text(customer.zipcode || "-");
        $("#profileAddress").text(customer.addressline || "-");

        if (customer.image_path) {
          $("#profileAvatar").attr("src", `${url}/${customer.image_path}`);
        }
      },
      error: function () {
        $("#profileName").text(sessionName);
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
      headers: { Authorization: "Bearer " + token },
      success: function (data) {
        allOrders = data.rows || [];
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

  $(document).on("click", ".viewOrderBtn", function () {
    const orderId = $(this).data("id");
    const order = allOrders.find((item) => String(item.id) === String(orderId));

    if (!order) {
      return;
    }

    let itemsHtml = "";
    let itemsTotal = 0;

    if (order.OrderLines && order.OrderLines.length > 0) {
      order.OrderLines.forEach((item) => {
        const subtotal = parsePrice(item.price) * item.quantity;
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

  $(document).on("click", "#logoutBtn", function () {
    sessionStorage.clear();
    window.location.href = "home.html";
  });

  loadProfile();
  loadOrders();
});
