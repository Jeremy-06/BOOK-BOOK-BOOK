# BOOK-BOOK-BOOK — Project Requirements → Function Map (Deep Links)

Gamitin itong map para mabilis na mahanap ang mga code kapag nagtanong ang professor. Kapag pinindot ang link, bubukas ang file at **didiretso ang cursor sa eksaktong linya ng function**.

---

## MP1 — Products NodeJS CRUD API (20 pts)
- [`getAllBooks`](./backend/controllers/book.js#L158) — list/read all books
- [`getSingleBook`](./backend/controllers/book.js#L245) — read one book
- [`createBook`](./backend/controllers/book.js#L265) — create
- [`updateBook`](./backend/controllers/book.js#L334) — update
- [`deleteBook`](./backend/controllers/book.js#L540) — delete
- [`Routes: backend/routes/book.js`](./backend/routes/book.js#L7) 

## MP2 — User NodeJS CRUD API (20 pts)
- [`getAllUsers`](./backend/controllers/user.js#L346)
- [`getUserProfile`](./backend/controllers/user.js#L317)
- [`updateUser`](./backend/controllers/user.js#L139)
- [`updateProfile`](./backend/controllers/user.js#L214)
- [`deactivateUser`](./backend/controllers/user.js#L266)
- [`reactivateUser`](./backend/controllers/user.js#L292)
- [`Routes: backend/routes/user.js`](./backend/routes/user.js#L20)

## MP3 — CRUD jQuery/DataTables + multiple file uploads (for MP1) (20 pts)
- [`buildBookFormData`](./frontend/js/admin-books.js#L191) — assembles multi-file form data
- [`parseImages`](./frontend/js/admin-books.js#L65)
- [`getBookImages`](./frontend/js/admin-books.js#L77)
- [`getBookImageRecords`](./frontend/js/admin-books.js#L82)
- [`renderImagePreviews`](./frontend/js/admin-books.js#L141)
- [`resetImageQueue`](./frontend/js/admin-books.js#L181)
- [`renderBookRow`](./frontend/js/admin-books.js#L241) — DataTables row rendering
- [`fetchBooks`](./frontend/js/admin-books.js#L266) / [`refreshBooks`](./frontend/js/admin-books.js#L299)
- Backend multi-upload (Multer config): [`backend/utils/multer.js`](./backend/utils/multer.js#L1) 
- Backend multi-upload (Route handler): [`upload.array("images", 10)`](./backend/routes/book.js#L13)
- View: [`frontend/admin/books.html`](./frontend/admin/books.html#L1)

## MP4 — CRUD jQuery/DataTables frontend (for MP2)
- [`fetchUsers`](./frontend/js/admin-users.js#L75)
- [`refreshUsers`](./frontend/js/admin-users.js#L108)
- [`renderUserRow`](./frontend/js/admin-users.js#L45)
- [`getFullName`](./frontend/js/admin-users.js#L37)
- View: [`frontend/admin/users.html`](./frontend/admin/users.html#L1)

## MP5 — Generate/send auth tokens (15 pts) + save token on users table (5 pts)
- [`loginUser`](./backend/controllers/user.js#L84) — generates & returns JWT
- [`registerUser`](./backend/controllers/user.js#L39)
- [`isAuthenticatedUser`](./backend/middlewares/auth.js#L4) — verifies token
- Token persistence Model: [`backend/models/user.js`](./backend/models/user.js#L1) 

## MP6 — Registration/Login via jQuery AJAX; admin role update; deactivate users; users DataTable (20 pts)
- [`registerUser`](./backend/controllers/user.js#L39) / [`loginUser`](./backend/controllers/user.js#L84)
- [`updateUserRole`](./backend/controllers/user.js#L388) — admin changes role
- [`deactivateUser`](./backend/controllers/user.js#L266) / [`reactivateUser`](./backend/controllers/user.js#L292)
- Frontend AJAX validation: [`validateRequiredField`](./frontend/js/user.js#L5)
- Users list DataTable: [`fetchUsers`](./frontend/js/admin-users.js#L75)

## MP7 — Sequelize ORM on CRUD functions (20 pts)
- [`backend/config/database.js`](./backend/config/database.js#L1) — Sequelize connection
- [`backend/models/index.js`](./backend/models/index.js#L1) — model associations
- Models: [`book.js`](./backend/models/book.js#L1), [`bookimage.js`](./backend/models/bookimage.js#L1), [`user.js`](./backend/models/user.js#L1), [`order.js`](./backend/models/order.js#L1), [`orderline.js`](./backend/models/orderline.js#L1), [`stock.js`](./backend/models/stock.js#L1), [`customer.js`](./backend/models/customer.js#L1)

---

## Transactions CRUD API + jQuery frontend (NodeJS) (25 pts)
- [`createOrder`](./backend/controllers/order.js#L37) — checkout
- [`getAllOrders`](./backend/controllers/order.js#L187)
- [`myOrders`](./backend/controllers/order.js#L244)
- [`updateOrderStatus`](./backend/controllers/order.js#L264)
- [`cancelOrder`](./backend/controllers/order.js#L331)
- Routes: [`backend/routes/order.js`](./backend/routes/order.js#L13)
- Frontend Admin Orders: [`fetchOrders`](./frontend/js/admin-orders.js#L95), [`renderOrderRow`](./frontend/js/admin-orders.js#L68)
- Cart/checkout on storefront: [`addToCart`](./frontend/js/home.js#L281)
- Customer order history: [`loadOrders`](./frontend/js/profile.js#L227), [`renderOrders`](./frontend/js/profile.js#L154), [`canCancelOrder`](./frontend/js/profile.js#L149)

## Send email on transaction update + attach PDF receipt (10 pts)
- [`sendEmail`](./backend/utils/sendEmail.js#L4)
- [`generatePDF`](./backend/utils/generatePDF.js#L15) — builds the order receipt PDF
- Triggered on Checkout: [`createOrder`](./backend/controllers/order.js#L129) 
- Triggered on Status Change: [`updateOrderStatus`](./backend/controllers/order.js#L285) 

---

## Quiz 4 — jQuery validation for MP3 and MP4 (15 pts)
- Books Form Validation: [`validateRequiredField`](./frontend/js/admin-books.js#L36) / [`validateRequiredFields`](./frontend/js/admin-books.js#L47)
- Users Form Validation: [`validateRequiredField`](./frontend/js/user.js#L5) / [`validateRequiredFields`](./frontend/js/user.js#L16)

## Quiz 5 — jQuery/API search & autocomplete on homepage (15 pts)
- API Controller: [`autocompleteBooks`](./backend/controllers/book.js#L210) 
- Route: [`GET /autocomplete`](./backend/routes/book.js#L9)
- Frontend Logic: [`debounce`](./frontend/js/home.js#L191), [`renderAutocompleteResults`](./frontend/js/home.js#L206)

## Quiz 6 — Route protection middleware; only admin roles access CRUD API (15 pts)
- Verify Token Middleware: [`isAuthenticatedUser`](./backend/middlewares/auth.js#L4)
- Verify Admin Role Middleware: [`isAdminUser`](./backend/middlewares/auth.js#L31)
- Applied in Admin Route: [`backend/routes/admin.js`](./backend/routes/admin.js#L6)

## Quiz 7 — Three (3) JS charts: bar, line, pie (15 pts)
- API Data Aggregation: [`getDashboardStats`](./backend/controllers/admin.js#L53) 
- Render Revenue (Line): [`renderRevenueChart`](./frontend/js/admin-dashboard.js#L62)
- Render Top Books (Bar): [`renderTopBooksChart`](./frontend/js/admin-dashboard.js#L102)
- Render Order Status (Pie/Donut): [`renderOrderStatusChart`](./frontend/js/admin-dashboard.js#L138)
- Fetch Data: [`fetchDashboardStats`](./frontend/js/admin-dashboard.js#L41)

---

## Unit Test 1 — UI/UX Design (20 pts)
- [`frontend/home.html`](./frontend/home.html#L1)
- [`frontend/admin/dashboard.html`](./frontend/admin/dashboard.html#L1)
- [`frontend/css/style.css`](./frontend/css/style.css#L1)

## Unit Test 2 — jQuery infinite scroll (datatable pagination not applicable) (20 pts)
- *Pending feature.* (Para sa home catalog loading)

## Unit 3 — Functional completeness / complexity / execution / contribution (40 pts)
- Server Entry Point: [`backend/server.js`](./backend/server.js#L1)