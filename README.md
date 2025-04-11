# WebApp

This is a Node.js Express-based web service that performs health checks by inserting a record into a database and responds with relevant HTTP status codes. The application uses Sequelize ORM for database interactions.

---

## Prerequisites

Before you begin, make sure the following tools and resources are ready:

- **Node.js** (v14.x or later)
- **npm** (Node Package Manager)
- **PostgreSQL/MySQL** database (depending on your `DB_DIALECT`)
- **AWS CLI** installed and configured

---

## Setup and Configuration

### 1. Clone the repository

```bash
git clone git@github.com:aswinlakshmanan-s/webapp-fork.git
cd webapp-fork
```

### 2. Create `.env` file

Create a `.env` file in the project root with the following content:

```env
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_DIALECT=your_db_dialect  # e.g., postgres or mysql
PORT=8080
```

Ensure that the database exists and credentials are valid.

---

## Install Dependencies

```bash
npm install
```

---

## Running the Application Locally

To start the server:

```bash
npm start
```

Expected logs:

```
Database connected...
Database synced...
Server is running on http://localhost:8080
```

---

## Health Check Endpoint - `/healthz`

- **GET /healthz**
  - Returns `200 OK` if the DB insert is successful.
  - Returns `400 Bad Request` if query params or content-length header is malformed.
  - Returns `503 Service Unavailable` on DB error.

- **Other HTTP methods** on `/healthz`: Returns `405 Method Not Allowed`.

- **All other routes**: Returns `404 Not Found`.

### Example Usage

```bash
curl http://localhost:8000/healthz
```

---

## Database Sync

The Sequelize model `HealthCheck` is automatically synchronized with the database when the server starts.

---

## HTTPS and Load Balancer Setup (Demo Environment)

In production/demo:

- The **Application Load Balancer (ALB)** serves traffic **only via HTTPS**.
- The **EC2 instance is not directly accessible** from the internet.
- Communication between the ALB and EC2 happens via **HTTP** (port 80).
- **HTTP to HTTPS redirection is not required**.
- Plain HTTP requests from the internet are not supported.

---

## SSL Certificate Import to AWS Certificate Manager

For the demo environment, use a certificate issued by a provider like **Namecheap** (not AWS-managed). After obtaining the cert and key files, use the AWS CLI to import them:

```bash
aws acm import-certificate \
  --certificate fileb://certificate.pem \
  --private-key fileb://private-key.pem \
  --certificate-chain fileb://certificate-chain.pem \
  --region us-east-1
```

- `certificate.pem` — The public certificate
- `private-key.pem` — The private key for the certificate
- `certificate-chain.pem` — The CA chain file (optional)

Once imported, attach the certificate ARN to the HTTPS listener of your Load Balancer.

---

## Security Best Practices

- EC2 instance is **private** and only accessible through the **load balancer**.
- S3 buckets are encrypted and block public access.
- Secrets are stored in AWS Secrets Manager using **KMS encryption**.
- KMS keys have **90-day automatic rotation enabled**.
- IAM policies follow the principle of **least privilege**.

---

## Troubleshooting

- Double-check `.env` values for DB credentials.
- Ensure DB is accessible (e.g., verify RDS security groups).
- Confirm secrets are available in Secrets Manager.
- Check ALB listener rules and SSL certificate validity.
- Use CloudWatch logs for application debugging.

---

## License

This project is licensed under the MIT License.
