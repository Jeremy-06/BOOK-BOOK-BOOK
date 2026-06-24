// User script
$(document).ready(function () {
  const url = "http://localhost:3000/";

  $("#registerBtn").on("click", function (e) {
    e.preventDefault();

    let name = $("#name").val();
    let email = $("#email").val();
    let password = $("#password").val();
    let confirmPassword = $("#confirmPassword").val();

    if (!name || !email || !password || !confirmPassword) {
      return Swal.fire({ icon: "error", text: "Please fill in all fields." });
    }

    if (password !== confirmPassword) {
      return Swal.fire({ icon: "error", text: "Passwords do not match." });
    }

    let user = { name, email, password };

    $.ajax({
      method: "POST",
      url: `${url}api/v1/users/register`,
      data: JSON.stringify(user),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "You can now log in to your account.",
          showConfirmButton: true,
        }).then(() => {
          window.location.href = "login.html";
        });
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text: error.responseJSON
            ? error.responseJSON.error
            : "Registration failed.",
        });
      },
    });
  });

  $("#loginBtn").on("click", function (e) {
    e.preventDefault();

    let email = $("#email").val();
    let password = $("#password").val();

    if (!email || !password) {
      return Swal.fire({
        icon: "error",
        text: "Please enter both email and password.",
      });
    }

    let user = { email, password };

    $.ajax({
      method: "POST",
      url: `${url}api/v1/users/login`,
      data: JSON.stringify(user),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        Swal.fire({
          icon: "success",
          text: data.message,
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        }).then(() => {
          sessionStorage.setItem("token", JSON.stringify(data.token));
          sessionStorage.setItem("userId", JSON.stringify(data.user.id));
          sessionStorage.setItem("role", data.user.role);
          window.location.href = "home.html";
        });
      },
      error: function (error) {
        Swal.fire({
          icon: "error",
          text: error.responseJSON
            ? error.responseJSON.message
            : "Login failed",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      },
    });
  });
});
