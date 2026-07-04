// User script
$(document).ready(function () {
  //const url = "http://localhost:3000";
  const url = `http://${window.location.hostname}:3000`;

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

  $("#registerForm").on("input change", ".required-field", function () {
    validateRequiredField($(this));
  });

  $("#registerForm").on("submit", function (e) {
    e.preventDefault();

    if (!validateRequiredFields($(this))) {
      return Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields highlighted in red.",
      });
    }

    let first_name = $("#firstName").val();
    let last_name = $("#lastName").val();
    let email = $("#email").val();
    let password = $("#password").val();
    let confirmPassword = $("#confirmPassword").val();

    if (password !== confirmPassword) {
      return Swal.fire({ icon: "error", text: "Passwords do not match." });
    }

    let user = { first_name, last_name, email, password };

    $.ajax({
      method: "POST",
      url: `${url}/api/v1/users/register`,
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
      url: `${url}/api/v1/users/login`,
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
          sessionStorage.setItem("userFirstName", data.user.first_name || "");
          sessionStorage.setItem("userLastName", data.user.last_name || "");
          sessionStorage.setItem("userEmail", data.user.email || "");
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
