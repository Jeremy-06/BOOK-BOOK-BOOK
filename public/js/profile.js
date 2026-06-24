$(document).ready(function () {
  const url = "http://localhost:3000";
  const token = sessionStorage.getItem("token");
  const userIdRaw = sessionStorage.getItem("userId");

  if (!token || !userIdRaw) {
    window.location.href = "login.html";
    return;
  }

  let userId = userIdRaw;
  try {
    userId = JSON.parse(userIdRaw);
  } catch (error) {
    userId = userIdRaw;
  }

  $.ajax({
    method: "GET",
    url: `${url}/api/v1/users/profile/${userId}`,
    dataType: "json",
    success: function (data) {
      const user = data.result;
      const customer = user.Customer || {};

      $("#profileName").text(user.name || "-");
      $("#profileEmail").text(user.email || "-");
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
      Swal.fire({
        icon: "error",
        text: "Unable to load profile.",
      }).then(() => {
        window.location.href = "home.html";
      });
    },
  });
});
