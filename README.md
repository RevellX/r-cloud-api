# 🌐 REST API with Node.js & Express.js

This is a simple and modular RESTful API built with **Node.js** and **Express.js** . It is designed for learning, rapid prototyping, or building scalable backend services.
It powers all of my hobby and learning projects.

---

## 📌 Features

- RESTful API using Express.js
- JSON request and response handling
- Structured routing and middleware
- Basic error handling and validation
- Modular and easy to extend

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- Sequelize
- Socket.io
- Mysql | InnoDB
- dotenv for environment variables
- nodemon for development

---

## 🚀 Getting Started

### 📥 Clone the Repository

```bash
git clone https://github.com/RevellX/r-cloud-api.git
cd r-cloud-api
node app/index.js
```

### 🛠 Install Dependencies
```bash
npm install
```

### 🔐 Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST="localhost"
DB_USER="[your_db_username]"
DB_PASSWORD="[your_db_password]"
DB_DATABASE="[your_db_name]"

JWT_KEY_SECRET="[your_secret_key_JWT]"

SSL_PRIVATEKEY="[absolute_path_to_your_private_key]"
SSL_CERTIFICATE="[aboslute_path_to_your_certificate]"

APP_DOMAIN="https://www.[your_domain_name]"
```

### ▶️ Run the Server
```bash
node app/index.js
```

### API Endpoints
Authentication endpoints
```http
POST   /api/authenticate       # Get access token by prividing user credentials
POST   /api/register           # Create new user account by providing user credentials
POST   /api/swap-users         # Swap order of two users in database
GET    /api/user               # Get user info
GET    /api/updateToken        # Get new access token
```
File upload and download endpoints
```http
POST   /api/file               # Used to upload new file to server
GET    /api/file-old/:fileId   # Get file by its id
GET    /api/files-old          # Get available users for logged user
```
Duties managment for work
```http
GET    /api/duties             # Get available duties and planned holidays
GET    /api/duty/:dutyDate     # Get duty by its date
PATCH  /api/duty/:dutyDate     # Edit dutyUser of a duty by its date
GET    /api/dutyUsers          # Get duty enabled users
GET    /api/dutyUser/:dutyUserId # Get duty enabled user by its id
POST   /api/dutyUser           # Register new duty enabled user
PATCH  /api/dutyUser/:dutyUserId # Edit duty enabled user
DELETE /api/dutyUser/:dutyUserId # Delete duty enabled user
```
Expenses managment
```http
GET    /api/expense/:expenseId # Get expense by its id
GET    /api/expenses/:groupId  # Get expenses assigned to a group
POST   /api/expense/:groupId   # Create new expense and add to group
PATCH  /api/expense/:expenseId # Edit expense by its id
DELETE /api/expense/:expenseId # Delete expense by its id
GET    /api/expense-groups     # Get available expense groups
POST   /api/expense-group      # Create new expense group
PATCH  /api/expense-group/:id  # Edit expense group by its id
DELETE /api/expense-group/:id  # Delete expense group by its id
```
Messenger chat endpoints
```http
GET   /api/messages/user/:id   # Get user by id
GET   /api/messages/users      # Get list of users who can be messaged
GET   /api/messages            # Get list of available chats
GET   /api/messages/:chatId    # Get list of messages in chat
POST  /api/messages/:chatId    # Send message to given chat
```
