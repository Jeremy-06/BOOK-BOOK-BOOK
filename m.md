# BOOK-BOOK-BOOK - Project Requirements -> Function Map (Deep Links)

Use this map to quickly locate the code during review. Every link points to the current workspace file and exact starting line for the related component.

---

## MP1 - Products NodeJS CRUD API (20 pts)

**Controllers - `backend/controllers/book.js`**
- [`getAllBooks`](./backend/controllers/book.js#L144) - list books, DataTables paging, homepage paging
- [`whereClause` search logic](./backend/controllers/book.js#L178) - title/author/isbn search
- [`order` sorting logic](./backend/controllers/book.js#L204) - server-side sort column/direction
- [`getSingleBook`](./backend/controllers/book.js#L262) - read one book
- [`createBook`](./backend/controllers/book.js#L290) - create book + stock + images
- [`updateBook`](./backend/controllers/book.js#L365) - update book + stock + image changes
- [`deleteBook`](./backend/controllers/book.js#L577) - delete book

**Routes - `backend/routes/book.js`**
- [`GET /api/v1/books`](./backend/routes/book.js#L7)
- [`GET /api/v1/books/:id`](./backend/routes/book.js#L11)
- [`POST /api/v1/books`](./backend/routes/book.js#L13)
- [`PUT /api/v1/books/:id`](./backend/routes/book.js#L15)
- [`DELETE /api/v1/books/:id`](./backend/routes/book.js#L17)

**App Mount**
- [`app.use("/api/v1/books", books)`](./backend/app.js#L13)

---

## MP2 - Category NodeJS CRUD API (20 pts)

**Controllers - `backend/controllers/category.js`**
- [`getAllCategories`](./backend/controllers/category.js#L7) - list categories with DataTables paging/search/sort
- [`Category search whereClause`](./backend/controllers/category.js#L28)
- [`Category order sorting`](./backend/controllers/category.js#L43)
- [`getSingleCategory`](./backend/controllers/category.js#L59) - read one category
- [`createCategory`](./backend/controllers/category.js#L75) - create
- [`updateCategory`](./backend/controllers/category.js#L101) - update
- [`deleteCategory`](./backend/controllers/category.js#L132) - delete

**Routes - `backend/routes/category.js`**
- [`GET /api/v1/categories`](./backend/routes/category.js#L13)
- [`GET /api/v1/categories/:id`](./backend/routes/category.js#L14)
- [`POST /api/v1/categories`](./backend/routes/category.js#L15)
- [`PUT /api/v1/categories/:id`](./backend/routes/category.js#L16)
- [`DELETE /api/v1/categories/:id`](./backend/routes/category.js#L17)

**App Mount / Model**
- [`app.use("/api/v1/categories", categories)`](./backend/app.js#L14)
- [`Category Sequelize model`](./backend/models/category.js#L1)

---

## MP3 - CRUD jQuery/DataTables + multiple file uploads (for MP1 - Books) (20 pts)

**Frontend JS - `frontend/js/admin-books.js`**
- [`$("#btable").DataTable({ serverSide: true ... })`](./frontend/js/admin-books.js#L291) - server-side DataTables initialization
- [`buildBookFormData`](./frontend/js/admin-books.js#L223) - builds FormData with fields, existing images, deleted images, main cover, and uploaded files
- [`selectedImages.forEach(... formData.append("images"))`](./frontend/js/admin-books.js#L258) - appends multiple uploaded files
- [`$("#bform").on("submit", ...)`](./frontend/js/admin-books.js#L426) - create/update form submission
- [`Book create/update AJAX`](./frontend/js/admin-books.js#L444)
- [`Edit book AJAX loader`](./frontend/js/admin-books.js#L489)
- [`Delete book AJAX`](./frontend/js/admin-books.js#L525)

**Backend**
- [`Book backend search whereClause`](./backend/controllers/book.js#L178)
- [`Book backend sorting order`](./backend/controllers/book.js#L204)
- [`createBook`](./backend/controllers/book.js#L290)
- [`updateBook`](./backend/controllers/book.js#L365)
- [`Multer storage config`](./backend/utils/multer.js#L4)
- [`Multer upload export/file filter`](./backend/utils/multer.js#L16)
- [`upload.array("images", 10) - create route`](./backend/routes/book.js#L13)
- [`upload.array("images", 10) - update route`](./backend/routes/book.js#L15)

**HTML View - `frontend/admin/books.html`**
- [`Books DataTable markup`](./frontend/admin/books.html#L113)
- [`Book form modal`](./frontend/admin/books.html#L147)
- [`Multiple file input`](./frontend/admin/books.html#L223)
- [`Create button`](./frontend/admin/books.html#L247)
- [`Update button`](./frontend/admin/books.html#L255)
- [`admin-books.js script include`](./frontend/admin/books.html#L276)

---

## MP4 - CRUD jQuery/DataTables frontend (for MP2 - Categories)

**Frontend JS - `frontend/js/admin-categories.js`**
- [`$("#categoriesTable").DataTable({ serverSide: true ... })`](./frontend/js/admin-categories.js#L52)
- [`Edit category button handler`](./frontend/js/admin-categories.js#L98)
- [`Delete category button handler`](./frontend/js/admin-categories.js#L121)
- [`Delete category AJAX`](./frontend/js/admin-categories.js#L133)
- [`$("#categoryForm").on("submit", ...)`](./frontend/js/admin-categories.js#L159)
- [`Create/update category AJAX`](./frontend/js/admin-categories.js#L173)

**HTML View - `frontend/admin/categories.html`**
- [`Categories DataTable container`](./frontend/admin/categories.html#L95)
- [`Categories DataTable markup`](./frontend/admin/categories.html#L97)
- [`Category form modal`](./frontend/admin/categories.html#L126)
- [`Category name input`](./frontend/admin/categories.html#L133)
- [`Category description textarea`](./frontend/admin/categories.html#L142)
- [`Create category button`](./frontend/admin/categories.html#L158)
- [`Update category button`](./frontend/admin/categories.html#L166)
- [`admin-categories.js script include`](./frontend/admin/categories.html#L183)

**API Used by Frontend**
- [`Category CRUD routes`](./backend/routes/category.js#L13)
- [`Category CRUD controller`](./backend/controllers/category.js#L7)

---

## MP5 - Generate/send auth tokens (15 pts) + save token on users table (5 pts)

- [`registerUser`](./backend/controllers/user.js#L25)
- [`loginUser`](./backend/controllers/user.js#L70)
- [`jwt.sign(...) token generation`](./backend/controllers/user.js#L96)
- [`Save token on user record`](./backend/controllers/user.js#L101)
- [`Return token to frontend`](./backend/controllers/user.js#L114)
- [`isAuthenticatedUser`](./backend/middlewares/auth.js#L4)
- [`JWT verify`](./backend/middlewares/auth.js#L21)
- [`User model token field`](./backend/models/user.js#L38)
- [`POST /api/v1/users/register`](./backend/routes/user.js#L21)
- [`POST /api/v1/users/login`](./backend/routes/user.js#L23)

---

## MP6 - Registration/Login via jQuery AJAX; admin role update; deactivate users; users DataTable (20 pts)

**Backend**
- [`registerUser`](./backend/controllers/user.js#L25)
- [`loginUser`](./backend/controllers/user.js#L70)
- [`deactivateUser`](./backend/controllers/user.js#L287)
- [`reactivateUser`](./backend/controllers/user.js#L313)
- [`getAllUsers`](./backend/controllers/user.js#L367)
- [`updateUserRole`](./backend/controllers/user.js#L427)
- [`User routes`](./backend/routes/user.js#L21)

**Frontend**
- [`Register form submit AJAX`](./frontend/js/user.js#L32)
- [`Register AJAX request`](./frontend/js/user.js#L55)
- [`Login button handler`](./frontend/js/user.js#L82)
- [`Login AJAX request`](./frontend/js/user.js#L97)
- [`Save token/session data`](./frontend/js/user.js#L111)
- [`Users DataTable`](./frontend/js/admin-users.js#L64)
- [`Role update AJAX`](./frontend/js/admin-users.js#L131)
- [`Deactivate user AJAX`](./frontend/js/admin-users.js#L163)
- [`Reactivate user AJAX`](./frontend/js/admin-users.js#L199)
- [`Users admin view`](./frontend/admin/users.html#L90)

---

## MP7 - Sequelize ORM on CRUD functions (20 pts)

- [`Sequelize connection`](./backend/config/database.js#L4)
- [`Server sync`](./backend/server.js#L7)
- [`Book model`](./backend/models/book.js#L1)
- [`Category model`](./backend/models/category.js#L1)
- [`BookImage model`](./backend/models/bookimage.js#L1)
- [`User model`](./backend/models/user.js#L1)
- [`Customer model`](./backend/models/customer.js#L1)
- [`Order model`](./backend/models/order.js#L1)
- [`OrderLine model`](./backend/models/orderline.js#L1)
- [`Stock model`](./backend/models/stock.js#L1)
- [`Book/Stock association`](./backend/models/index.js#L14)
- [`Book/BookImage association`](./backend/models/index.js#L22)
- [`Category/Book association`](./backend/models/index.js#L30)
- [`User/Customer association`](./backend/models/index.js#L46)
- [`User/Order association`](./backend/models/index.js#L55)
- [`Order/OrderLine association`](./backend/models/index.js#L58)
- [`Book/OrderLine association`](./backend/models/index.js#L61)

---

## Transactions CRUD API + jQuery frontend (NodeJS) (25 pts)

**Backend**
- [`createOrder`](./backend/controllers/order.js#L37) - checkout transaction
- [`Order transaction start`](./backend/controllers/order.js#L72)
- [`OrderLine create`](./backend/controllers/order.js#L88)
- [`Stock decrement`](./backend/controllers/order.js#L107)
- [`getAllOrders`](./backend/controllers/order.js#L187)
- [`myOrders`](./backend/controllers/order.js#L244)
- [`updateOrderStatus`](./backend/controllers/order.js#L264)
- [`cancelOrder`](./backend/controllers/order.js#L331)
- [`Order routes`](./backend/routes/order.js#L13)

**Frontend**
- [`Admin renderOrderRow`](./frontend/js/admin-orders.js#L68)
- [`Admin fetchOrders`](./frontend/js/admin-orders.js#L95)
- [`Admin status update AJAX`](./frontend/js/admin-orders.js#L225)
- [`Storefront addToCart`](./frontend/js/home.js#L284)
- [`Profile canCancelOrder`](./frontend/js/profile.js#L154)
- [`Profile renderOrders`](./frontend/js/profile.js#L159)
- [`Profile loadOrders`](./frontend/js/profile.js#L232)
- [`Profile cancel order AJAX`](./frontend/js/profile.js#L393)

---

## Send email on transaction update + attach PDF receipt (10 pts)

- [`sendEmail`](./backend/utils/sendEmail.js#L4)
- [`Nodemailer transporter`](./backend/utils/sendEmail.js#L7)
- [`Email attachments option`](./backend/utils/sendEmail.js#L21)
- [`generatePDF`](./backend/utils/generatePDF.js#L15)
- [`PDF receipt customer details`](./backend/utils/generatePDF.js#L49)
- [`PDF receipt items`](./backend/utils/generatePDF.js#L63)
- [`Checkout PDF generation`](./backend/controllers/order.js#L129)
- [`Checkout sendEmail`](./backend/controllers/order.js#L153)
- [`Status update PDF generation`](./backend/controllers/order.js#L285)
- [`Status update sendEmail`](./backend/controllers/order.js#L309)

---

## Quiz 4 - jQuery validation for MP3 and MP4 (15 pts)

- [`Books validateRequiredField`](./frontend/js/admin-books.js#L31)
- [`Books validateRequiredFields`](./frontend/js/admin-books.js#L42)
- [`Books form validation on submit`](./frontend/js/admin-books.js#L436)
- [`Categories validateRequiredField`](./frontend/js/admin-categories.js#L26)
- [`Categories validateRequiredFields`](./frontend/js/admin-categories.js#L36)
- [`Categories form validation on submit`](./frontend/js/admin-categories.js#L165)

---

## Quiz 5 - jQuery/API search & autocomplete on homepage (15 pts)

- [`autocompleteBooks`](./backend/controllers/book.js#L227)
- [`Autocomplete search query`](./backend/controllers/book.js#L229)
- [`Autocomplete route`](./backend/routes/book.js#L9)
- [`debounce`](./frontend/js/home.js#L194)
- [`renderAutocompleteResults`](./frontend/js/home.js#L209)
- [`fetchAutocompleteResults AJAX`](./frontend/js/home.js#L257)
- [`Search box HTML`](./frontend/home.html#L256)
- [`Autocomplete results HTML`](./frontend/home.html#L261)

---

## Quiz 6 - Route protection middleware; only admin roles access CRUD API (15 pts)

- [`isAuthenticatedUser`](./backend/middlewares/auth.js#L4)
- [`Authorization header read`](./backend/middlewares/auth.js#L6)
- [`JWT verify`](./backend/middlewares/auth.js#L21)
- [`isAdminUser`](./backend/middlewares/auth.js#L31)
- [`Admin role check`](./backend/middlewares/auth.js#L35)
- [`Admin dashboard protected route`](./backend/routes/admin.js#L6)
- [`Category protected create/update/delete routes`](./backend/routes/category.js#L15)

---

## Quiz 7 - Three JS charts: bar, line, pie/donut (15 pts)

- [`getDashboardStats`](./backend/controllers/admin.js#L53)
- [`Revenue aggregation`](./backend/controllers/admin.js#L83)
- [`Top books aggregation`](./backend/controllers/admin.js#L84)
- [`Order status aggregation`](./backend/controllers/admin.js#L85)
- [`Admin dashboard stats route`](./backend/routes/admin.js#L6)
- [`fetchDashboardStats`](./frontend/js/admin-dashboard.js#L41)
- [`renderRevenueChart`](./frontend/js/admin-dashboard.js#L62)
- [`renderTopBooksChart`](./frontend/js/admin-dashboard.js#L102)
- [`renderOrderStatusChart`](./frontend/js/admin-dashboard.js#L138)

---

## Unit Test 1 - UI/UX Design (20 pts)

- [`Homepage hero/catalog view`](./frontend/home.html#L196)
- [`Homepage catalog section`](./frontend/home.html#L245)
- [`Admin dashboard view`](./frontend/admin/dashboard.html#L1)
- [`Admin books view`](./frontend/admin/books.html#L113)
- [`Admin categories view`](./frontend/admin/categories.html#L95)
- [`Main stylesheet`](./frontend/css/style.css#L1)

---

## Unit Test 2 - jQuery infinite scroll (20 pts)

- [`Infinite scroll state: currentPage/isFetching/hasMoreBooks`](./frontend/js/home.js#L37)
- [`fetchBooks`](./frontend/js/home.js#L468)
- [`Homepage books AJAX paging`](./frontend/js/home.js#L471)
- [`appendBooks for next pages`](./frontend/js/home.js#L400)
- [`hasMoreBooks = response.hasMore`](./frontend/js/home.js#L487)
- [`$(window).on("scroll", ...)`](./frontend/js/home.js#L793)
- [`Scroll guard: !isFetching && hasMoreBooks`](./frontend/js/home.js#L795)
- [`Backend hasMore response`](./backend/controllers/book.js#L218)

---

## Unit 3 - Functional completeness / complexity / execution / contribution (40 pts)

- [`Server entry point`](./backend/server.js#L1)
- [`Database sync and app listen`](./backend/server.js#L7)
- [`Express app setup`](./backend/app.js#L1)
- [`Static image serving`](./backend/app.js#L11)
- [`API route mounts`](./backend/app.js#L13)

---

## Bonus / Additional - Users CRUD still implemented

**Controllers - `backend/controllers/user.js`**
- [`getAllUsers`](./backend/controllers/user.js#L367)
- [`getUserProfile`](./backend/controllers/user.js#L338)
- [`updateUser`](./backend/controllers/user.js#L125)
- [`updateProfile`](./backend/controllers/user.js#L200)
- [`deactivateUser`](./backend/controllers/user.js#L287)
- [`reactivateUser`](./backend/controllers/user.js#L313)
- [`updateUserRole`](./backend/controllers/user.js#L427)

**Routes - `backend/routes/user.js`**
- [`GET /api/v1/users`](./backend/routes/user.js#L44)
- [`GET /api/v1/users/profile/:id`](./backend/routes/user.js#L42)
- [`POST /api/v1/users/update-profile`](./backend/routes/user.js#L25)
- [`PUT /api/v1/users/profile`](./backend/routes/user.js#L29)
- [`DELETE /api/v1/users/deactivate`](./backend/routes/user.js#L38)
- [`PUT /api/v1/users/reactivate`](./backend/routes/user.js#L40)
- [`PUT /api/v1/users/:id/role`](./backend/routes/user.js#L46)

**Frontend**
- [`Users DataTable`](./frontend/js/admin-users.js#L64)
- [`Role modal view`](./frontend/admin/users.html#L109)
- [`Reactivate modal view`](./frontend/admin/users.html#L146)
- [`admin-users.js script include`](./frontend/admin/users.html#L188)