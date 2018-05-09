# Serverless JWT Auth Boilerplate

A [Serverless](https://serverless.com/) REST API boilerplate for authenticating with email/password over JWT (JSON Web Tokens). 

In production, it uses:

- [AWS Lambda](https://aws.amazon.com/lambda/) for computing
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database storage (there is a free-for-life tier)
- [AWS Cloudformation](https://aws.amazon.com/cloudformation/) to provision the AWS resources
- [AWS S3](https://aws.amazon.com/s3/) for object storage (storing the code)

---

## Installation

```bash
# Clone the repo
git clone https://github.com/mcnamee/serverless-jwt-auth.git serverless-jwt-auth

# Install dependencies
cd serverless-jwt-auth && npm install

# Add your secrets (and update the DB connection)
cp secrets.example.json secrets.json
```

---

## Usage

### Development

You can use Serverless Offline while you develop:

```bash
sls offline start --skipCacheInvalidation
```

### Production

__1. Setup your AWS credentials__

_Create a new AWS IAM user and assign the `AdministratorAccess` policy to the new user (later, it's best to reduce the permissions this IAM User has for security reasons)._

```bash
serverless config credentials --provider aws --key <YOUR_AWS_KEY> --secret <YOUR_AWS_SECRET>
```

__2. Then deploy to AWS__

```bash
sls deploy
```

---

## Endpoints

### Register

```json
POST /register

{
  "name": "John Smith",
  "email": "john@smith.co",
  "password": "123Abc123"
}
```

### Login

```json
POST /login

{
  "name": "John Smith",
  "email": "john@smith.co",
  "password": "123Abc123"
}
```

### My Details

```json
GET /me
```

### List All Users

```json
GET /users
```

---

Boilerplate taken from the [awesome tutorial over here](https://medium.freecodecamp.org/a-crash-course-on-securing-serverless-apis-with-json-web-tokens-ff657ab2f5a5).
