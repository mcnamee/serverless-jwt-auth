# Serverless JWT Auth Boilerplate

A [Serverless](https://serverless.com/) REST API boilerplate for authenticating with email/password over JWT (JSON Web Tokens). 

In production, it uses:

- [AWS Lambda](https://aws.amazon.com/lambda/) for computing
- [AWS Dynamodb](https://aws.amazon.com/dynamodb‎) for database storage
- [AWS Cloudformation](https://aws.amazon.com/cloudformation/) to provision the AWS resources
- [AWS S3](https://aws.amazon.com/s3/) for object storage (storing the code)

---

## Installation

```bash
# Install the Serverless CLI
yarn global add serverless

# Clone the repo
git clone https://github.com/mcnamee/serverless-jwt-auth.git serverless-jwt-auth

# Install dependencies
cd serverless-jwt-auth && yarn install

# Add your secrets (and update the JWT secret)
cp secrets.example.json secrets.json
```

---

## Usage

### Development

You can use Serverless Offline while you develop, which starts a local DynamoDB instance (data is reset on each start)

```bash
yarn start
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
Request: POST /register

{
  "firstname": "John",
  "lastname": "Smith",
  "email": "john@smith.co",
  "password": "123Abc123"
}

# Response

{
  "message": "Success",
  "data": {
    "token": "<YOUR-JWT-TOKEN>"
  }
}
```

### Login

```json
# Request: POST /login

{
  "email": "john@smith.co",
  "password": "123Abc123"
}

# Response

{
  "message": "Success",
  "data": {
    "token": "<YOUR-JWT-TOKEN>",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": 1536134110955,
    "level": "standard",
    "id": "03969310-b0e1-11e8-a48b-efa31124d46c",
    "email": "john@doe.com",
    "updatedAt": 1536134110955
  }
}
```

### My Details

```json
# Request: GET /user

# Response

{
  "message": "Success",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": 1536134110955,
    "level": "standard",
    "id": "03969310-b0e1-11e8-a48b-efa31124d46c",
    "email": "john@doe.com",
    "updatedAt": 1536276034130
  }
}
```


### Update User

```json
Request: PUT /user

{
  "firstname": "Jane",
  "lastname": "Doe"
}

# Response

{
  "message": "User Updated",
  "data": {
    "firstName": "Jane",
    "lastName": "Doe",
    "createdAt": 1536134110955,
    "level": "standard",
    "id": "03969310-b0e1-11e8-a48b-efa31124d46c",
    "email": "john@doe.com",
    "updatedAt": 1536276156160
  }
}
```
