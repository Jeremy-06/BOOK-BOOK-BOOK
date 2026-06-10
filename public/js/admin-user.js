$(document).ready(function () {
    const url = 'http://localhost:3000';

    // 1. Security Check: Admin lang pwede rito!
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('role');

    if (!token || userRole !== 'admin') {
        Swal.fire({ icon: 'error', text: 'Access Denied. Admins only.' })
            .then(() => window.location.href = '../home.html');
        return;
    }

    // 2. Load Users DataTable
    const table = $('#usersTable').DataTable({
        ajax: {
            url: `${url}/api/v1/users`,
            dataSrc: 'rows'
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' },
            { 
                data: 'role',
                render: function(data) {
                    return data === 'admin' 
                        ? `<span class="badge bg-danger">Admin</span>` 
                        : `<span class="badge bg-primary">User</span>`;
                }
            },
            { 
                data: 'deleted_at',
                render: function(data) {
                    return data === null 
                        ? `<span class="badge bg-success">Active</span>` 
                        : `<span class="badge bg-secondary">Deactivated</span>`;
                }
            },
            {
                data: null,
                render: function (data) {
                    let btns = `<button class="btn btn-sm btn-outline-primary editRoleBtn" data-id="${data.id}" data-role="${data.role}"><i class="fas fa-user-edit"></i> Role</button> `;
                    if(data.deleted_at === null) {
                        btns += `<button class="btn btn-sm btn-outline-danger deactivateBtn" data-email="${data.email}"><i class="fas fa-ban"></i> Deactivate</button>`;
                    }
                    return btns;
                }
            }
        ]
    });

    // 3. Open Role Modal
    $('#usersTable tbody').on('click', '.editRoleBtn', function () {
        const id = $(this).data('id');
        const role = $(this).data('role');
        
        $('#editUserId').val(id);
        $('#userRole').val(role);
        $('#roleModal').modal('show');
    });

    // 4. Save Role Update
    $('#saveRoleBtn').on('click', function() {
        const id = $('#editUserId').val();
        const role = $('#userRole').val();

        $.ajax({
            method: "PUT",
            url: `${url}/api/v1/users/${id}/role`,
            data: JSON.stringify({ role }),
            contentType: 'application/json',
            success: function (data) {
                $('#roleModal').modal('hide');
                table.ajax.reload();
                Swal.fire({ icon: 'success', text: 'Role updated successfully', timer: 1500 });
            }
        });
    });

    // 5. Deactivate User
    $('#usersTable tbody').on('click', '.deactivateBtn', function () {
        const email = $(this).data('email');

        bootbox.confirm("Are you sure you want to deactivate this user?", function(result){
            if(result) {
                $.ajax({
                    method: "DELETE",
                    url: `${url}/api/v1/users/deactivate`,
                    data: JSON.stringify({ email }),
                    contentType: 'application/json',
                    success: function (data) {
                        table.ajax.reload();
                        Swal.fire({ icon: 'success', text: 'User deactivated', timer: 1500 });
                    }
                });
            }
        });
    });
});