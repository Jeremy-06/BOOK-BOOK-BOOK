$(document).ready(function () {
  //const url = "http://localhost:3000";
  const url = `http://${window.location.hostname}:3000`;
  const rawToken = sessionStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/"/g, "") : null;

  const rawRole = sessionStorage.getItem("role");
  const userRole = rawRole ? rawRole.replace(/"/g, "") : null;

  // Security Check
  if (!token || userRole !== "admin") {
    Swal.fire({ icon: "error", text: "Access Denied. Admins only." }).then(
      () => (window.location.href = "../home.html"),
    );
    return;
  }

  let allOrders = []; // Dito natin ise-save ang data para makuha mamaya sa modal

  function getFullName(user) {
    return user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User" : "Unknown User";
  }

  // Initialize DataTable
  const table = $("#ordersTable").DataTable({
    ajax: {
      url: `${url}/api/v1/orders`,
      dataSrc: function (json) {
        allOrders = json.rows; // I-save sa variable
        return json.rows;
      },
      headers: { Authorization: "Bearer " + token },
    },
    columns: [
      { data: "id", render: (data) => `<strong>#${data}</strong>` },
      {
        data: "User",
        render: (data) => getFullName(data),
      },
      {
        data: "date_placed",
        render: (data) =>
          new Date(data).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
      },
      {
        data: "OrderLines",
        render: function (data) {
          return data ? data.reduce((sum, item) => sum + item.quantity, 0) : 0;
        },
      },
      {
        data: null,
        render: function (data) {
          let shipping = parseFloat(data.shipping_fee) || 100;
          let itemsTotal = data.OrderLines
            ? data.OrderLines.reduce(
                (sum, item) => sum + parseFloat(item.price) * item.quantity,
                0,
              )
            : 0;
          return `₱${(shipping + itemsTotal).toFixed(2)}`;
        },
      },
      {
        data: "status",
        render: function (data) {
          let badgeClass = "bg-secondary";
          if (data === "Processing") badgeClass = "bg-primary";
          if (data === "Shipped") badgeClass = "bg-info";
          if (data === "Delivered") badgeClass = "bg-success";
          if (data === "Cancelled") badgeClass = "bg-danger";
          return `<span class="badge ${badgeClass}">${data}</span>`;
        },
      },
      {
        data: null,
        render: function (data) {
          return `<button class="btn btn-sm btn-outline-dark viewOrderBtn" data-id="${data.id}"><i class="fas fa-eye"></i> View</button>`;
        },
      },
    ],
  });

  // View Order Details Modal
  $("#ordersTable tbody").on("click", ".viewOrderBtn", function () {
    const orderId = $(this).data("id");
    const order = allOrders.find((o) => o.id === orderId);

    if (!order) return;

    $("#modalOrderId").text(order.id);
    $("#modalCustomer").text(getFullName(order.User));
    $("#modalEmail").text(order.User ? order.User.email : "N/A");

    let itemsHtml = "";
    let itemsTotal = 0;

    if (order.OrderLines && order.OrderLines.length > 0) {
      order.OrderLines.forEach((item) => {
        let sub = parseFloat(item.price) * item.quantity;
        itemsTotal += sub;
        itemsHtml += `
                    <tr>
                        <td>${item.Book ? item.Book.title : "Unknown Book"}</td>
                        <td>${item.quantity}</td>
                        <td>₱${parseFloat(item.price).toFixed(2)}</td>
                        <td>₱${sub.toFixed(2)}</td>
                    </tr>
                `;
      });
    } else {
      itemsHtml =
        '<tr><td colspan="4" class="text-center">No items found</td></tr>';
    }

    $("#modalItemsBody").html(itemsHtml);

    let shipping = parseFloat(order.shipping_fee) || 100;
    $("#modalShipping").text(`₱${shipping.toFixed(2)}`);
    $("#modalGrandTotal").text(`₱${(itemsTotal + shipping).toFixed(2)}`);

    // I-set ang current status sa dropdown para i-update
    $("#updateStatusSelect").val(order.status || "Processing");

    // I-save ang ID sa button para madaling kunin sa update
    $("#saveStatusBtn").data("id", order.id);

    $("#orderModal").modal("show");
  });

  // Update Status
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
        table.ajax.reload();
        Swal.fire({
          icon: "success",
          text: "Order status updated!",
          timer: 1500,
        });
      },
      error: function (err) {
        Swal.fire({ icon: "error", text: "Failed to update status" });
      },
    });
  });
});
