let revChart;
let topBooksChart;
let orderStatusChart;

$(document).ready(function () {
  const url = `http://${window.location.hostname}:3000`;
  const rawToken = sessionStorage.getItem("token");
  const token = rawToken ? rawToken.replace(/"/g, "") : null;
  const rawRole = sessionStorage.getItem("role");
  const userRole = rawRole ? rawRole.replace(/"/g, "") : null;
  const chartColors = {
    blue: "#007bff",
    navy: "#343a40",
    green: "#28a745",
    amber: "#ffc107",
    red: "#dc3545",
    cyan: "#17a2b8",
  };

  if (!token || userRole !== "admin") {
    Swal.fire({ icon: "error", text: "Access Denied. Admins only." }).then(
      () => (window.location.href = "../home.html"),
    );
    return;
  }

  // Build query
  function buildStatsUrl() {
    const params = new URLSearchParams();
    const startDate = $("#startDate").val();
    const endDate = $("#endDate").val();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();
    return `${url}/api/v1/admin/dashboard-stats${query ? `?${query}` : ""}`;
  }

  // Fetch stats
  function fetchDashboardStats() {
    $.ajax({
      method: "GET",
      url: buildStatsUrl(),
      dataType: "json",
      headers: { Authorization: "Bearer " + token },
      success: function (data) {
        renderRevenueChart(data.revenue);
        renderTopBooksChart(data.topBooks);
        renderOrderStatusChart(data.orderStatus);
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text: error.responseJSON?.error || "Unable to load dashboard stats.",
        });
      },
    });
  }

  // Revenue chart
  function renderRevenueChart(revenue) {
    if (revChart) revChart.destroy();

    revChart = new Chart(document.getElementById("revenueChart"), {
      type: "line",
      data: {
        labels: revenue.labels,
        datasets: [
          {
            label: "Revenue",
            data: revenue.data,
            borderColor: chartColors.blue,
            backgroundColor: "rgba(0, 123, 255, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "PHP " + value;
              },
            },
          },
        },
      },
    });
  }

  // Books chart
  function renderTopBooksChart(topBooks) {
    if (topBooksChart) topBooksChart.destroy();

    topBooksChart = new Chart(document.getElementById("topBooksChart"), {
      type: "bar",
      data: {
        labels: topBooks.labels,
        datasets: [
          {
            label: "Quantity Sold",
            data: topBooks.data,
            backgroundColor: chartColors.navy,
            borderColor: chartColors.blue,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // Status chart
  function renderOrderStatusChart(orderStatus) {
    if (orderStatusChart) orderStatusChart.destroy();

    orderStatusChart = new Chart(document.getElementById("orderStatusChart"), {
      type: "pie",
      data: {
        labels: orderStatus.labels,
        datasets: [
          {
            data: orderStatus.data,
            backgroundColor: [
              chartColors.blue,
              chartColors.green,
              chartColors.amber,
              chartColors.red,
              chartColors.cyan,
              chartColors.navy,
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  $("#filterBtn").on("click", function () {
    fetchDashboardStats();
  });

  fetchDashboardStats();
});
