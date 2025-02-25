
# webapp

This is a simple Express-based API that performs health checks on a service by inserting a record into a database and responds with various HTTP status codes. It utilizes Sequelize for database interactions.

## Prerequisites

Before you begin, ensure that you have met the following requirements:

- **Node.js** (v14.x or later)                      
- **npm** (Node Package Manager)
- **PostgreSQL/MySQL** or any compatible database (based on your `DB_DIALECT` in `.env`)
- **.env file** (with required database connection details)

### Install Dependencies

Install the required dependencies for the application by running:

```bash
npm install
```

## Setup and Configuration

1. **Clone the repository**

   ```bash
   git clone git@github.com:aswinlakshmanan-s/webapp-fork.git
   cd webapp-fork
   ```

2. **Create a `.env` file**

   In the root directory of the project, create a `.env` file and add your database configuration:

   ```env
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_db_host
   DB_PORT=your_db_port
   DB_DIALECT=your_db_dialect   # e.g., mysql, postgres
   PORT=8000                    # The port to run your application on
   ```

   > Ensure the database you reference is set up and accessible.

## Build and Deploy Instructions

### 1. **Running the Application Locally**

To start the Express server and the health check route, run the following command:

```bash
npm start
```

This will:

- Initialize the database connection.
- Set up routes for `/healthz` to handle health check requests.

### 2. **Health Check Route `/healthz`**

The API provides a health check endpoint at `/healthz`:

- **GET /healthz**: Inserts a record into the `HealthCheck` table of the database and responds with `200 OK` if successful.
  - Returns `400 Bad Request` if the content length header is set incorrectly or if query parameters are passed.
  - Returns `503 Service Unavailable` if there is an error inserting the health check into the database.
  
- **Any other HTTP method (POST, PUT, DELETE, etc.) on `/healthz`**: Returns `405 Method Not Allowed`.

- **Any other routes**: Returns `404 Not Found`.

### 3. **Database Synchronization**

Once you start the server, the database will be synchronized with the `HealthCheck` model. You should see the following log message when the server starts:

```
Database connected...
Database synced...
Server is running on http://localhost:8000
```

### 4. **Test the HealthCheck API**

To test the health check, you can make a GET request to `/healthz` using a tool like Postman or `curl`:

```bash
curl http://localhost:8000/healthz
```

You should receive a `200 OK` status if the health check is successful.

## Troubleshooting

If you encounter issues, consider the following:

- Ensure that your `.env` file contains the correct database credentials.
- Verify that the database is accessible.
- Check the console for any errors related to the database connection or API routes.

## License

This project is licensed under the MIT License.
