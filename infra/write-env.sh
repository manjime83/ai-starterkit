#!/bin/sh
# Writes the app-facing Terraform outputs to ../.env.infra for copying into .env.
# Reads whichever environment's state the working directory is currently initialized
# against (terraform init -backend-config=build/<env>.s3.tfbackend).
# The single app user's key pair fills both the SES_* and BUCKET_* env pairs.
set -eu

cd "$(dirname "$0")"

{
  echo "BUCKET_ACCESS_KEY_ID=\"$(terraform output -raw app_access_key_id)\""
  echo "BUCKET_SECRET_ACCESS_KEY=\"$(terraform output -raw app_secret_access_key)\""
  echo "BUCKET_REGION=\"$(terraform output -raw aws_region)\""
  echo "BUCKET_NAME=\"$(terraform output -raw bucket_id)\""
  echo ""
  echo "SES_ACCESS_KEY_ID=\"$(terraform output -raw app_access_key_id)\""
  echo "SES_SECRET_ACCESS_KEY=\"$(terraform output -raw app_secret_access_key)\""
  echo "SES_REGION=\"$(terraform output -raw aws_region)\""
  echo "EMAIL_FROM=\"$(terraform output -raw ses_from_email)\""
} > ../.env.infra

echo "Wrote ../.env.infra — copy the values into .env (both files are gitignored)."
