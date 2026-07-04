$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;
  const limit = 25;
  let currentPage = 1;
  let isFetching = false;
  let hasMoreOrders = true;
  let currentSortBy = "id";
  let currentSortOrder = "DESC";
  let allOrders = [];

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

  function getFullName(user) {
    return user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          "Unknown User"
      : "Unknown User";
  }

  function getOrderItemsTotal(order) {
    return order.OrderLines
      ? order.OrderLines.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0,
        )
      : 0;
  }

  function getOrderItemsCount(order) {
    return order.OrderLines
      ? order.OrderLines.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
  }

  function renderStatusBadge(status) {
    let badgeClass = "bg-secondary";
    if (status === "Processing") badgeClass = "bg-primary";
    if (status === "Shipped") badgeClass = "bg-info";
    if (status === "Delivered") badgeClass = "bg-success";
    if (status === "Cancelled") badgeClass = "bg-danger";
    return `<span class="badge ${badgeClass}">${escapeHtml(status)}</span>`;
  }

  function renderOrderRow(order) {
    const shipping = parseFloat(order.shipping_fee) || 100;
    const total = shipping + getOrderItemsTotal(order);
    const datePlaced = order.date_placed
      ? new Date(order.date_placed).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

    return `
      <tr data-id="${order.id}">
        <td><strong>#${order.id}</strong></td>
        <td>${escapeHtml(getFullName(order.User))}</td>
        <td>${escapeHtml(datePlaced)}</td>
        <td>${getOrderItemsCount(order)}</td>
        <td>PHP ${total.toFixed(2)}</td>
        <td>${renderStatusBadge(order.status)}</td>
        <td>
          <button class="btn btn-sm btn-outline-dark viewOrderBtn" data-id="${order.id}"><i class="fas fa-eye"></i> View</button>
        </td>
      </tr>
    `;
  }

  function fetchOrders() {
    if (isFetching || !hasMoreOrders) return;

    isFetching = true;

    $.ajax({
      method: "GET",
      url: `${url}/api/v1/orders?page=${currentPage}&limit=${limit}&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}`,
      dataType: "json",
      headers: { Authorization: "Bearer " + token },
      success: function (data) {
        const orders = data.rows || [];

        if (currentPage === 1 && orders.length === 0) {
          $("#ordersTable tbody").html(
            '<tr><td colspan="7" class="text-center text-muted py-4">No orders found.</td></tr>',
          );
        } else {
          allOrders = [...allOrders, ...orders];
          $("#ordersTable tbody").append(orders.map(renderOrderRow).join(""));
        }

        hasMoreOrders = Boolean(data.hasMore);
        currentPage += 1;
      },
      error: function () {
        Swal.fire({ icon: "error", text: "Unable to load orders." });
      },
      complete: function () {
        isFetching = false;
      },
    });
  }

  function refreshOrders() {
    currentPage = 1;
    hasMoreOrders = true;
    isFetching = false;
    allOrders = [];
    $("#ordersTable tbody").empty();
    fetchOrders();
  }

  $(".custom-table-scroll").on("scroll", function () {
    if (
      Math.ceil($(this).scrollTop() + $(this).innerHeight()) >=
      $(this)[0].scrollHeight - 5
    ) {
      fetchOrders();
    }
  });

  $("#ordersTable").on("click", "th.sortable", function () {
    const sortBy = $(this).data("sort");

    if (currentSortBy === sortBy) {
      currentSortOrder = currentSortOrder === "ASC" ? "DESC" : "ASC";
    } else {
      currentSortBy = sortBy;
      currentSortOrder = "ASC";
    }

    currentPage = 1;
    hasMoreOrders = true;
    isFetching = false;
    allOrders = [];
    $("#ordersTable tbody").empty();
    fetchOrders();
  });

  $("#ordersTable tbody").on("click", ".viewOrderBtn", function () {
    const orderId = $(this).data("id");
    const order = allOrders.find((item) => item.id === orderId);

    if (!order) return;

    $("#modalOrderId").text(order.id);
    $("#modalCustomer").text(getFullName(order.User));
    $("#modalEmail").text(order.User ? order.User.email : "N/A");

    let itemsHtml = "";
    let itemsTotal = 0;

    if (order.OrderLines && order.OrderLines.length > 0) {
      order.OrderLines.forEach((item) => {
        const subtotal = parseFloat(item.price) * item.quantity;
        itemsTotal += subtotal;
        itemsHtml += `
          <tr>
            <td>${escapeHtml(item.Book ? item.Book.title : "Unknown Book")}</td>
            <td>${item.quantity}</td>
            <td>PHP ${parseFloat(item.price).toFixed(2)}</td>
            <td>PHP ${subtotal.toFixed(2)}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml =
        '<tr><td colspan="4" class="text-center">No items found</td></tr>';
    }

    $("#modalItemsBody").html(itemsHtml);

    const shipping = parseFloat(order.shipping_fee) || 100;
    $("#modalShipping").text(`PHP ${shipping.toFixed(2)}`);
    $("#modalGrandTotal").text(`PHP ${(itemsTotal + shipping).toFixed(2)}`);
    $("#updateStatusSelect").val(order.status || "Processing");
    $("#saveStatusBtn").data("id", order.id);

    $("#orderModal").modal("show");
  });

  $("#saveStatusBtn").on("click", function () {
    const orderId = $(this).data("id");
    const newStatus = $("#updateStatusSelect").val();

    $.ajax({
      method: "PUT",
      url: `${url}/api/v1/orders/${orderId}/status`,
      data: JSON.stringify({ status: newStatus }),
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      success: function () {
        $("#orderModal").modal("hide");
        refreshOrders();
        Swal.fire({
          icon: "success",
          text: "Order status updated!",
          timer: 1500,
        });
      },
      error: function () {
        Swal.fire({ icon: "error", text: "Failed to update status" });
      },
    });
  });

  refreshOrders();
});
