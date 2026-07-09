# Infrastructure

Terraform for the AWS resources a project needs: a private uploads bucket, an application IAM user
(S3 + SES send), and — in the `production` workspace only — a versioned database-backups bucket with a
dedicated upload-only backup user (used by `../backup`).

Edit `terraform.tfvars` (and the backend `key` in `main.tf`) per project, then:

```bash
terraform init
terraform apply                          # dev (default workspace)
terraform workspace new production       # once
terraform workspace select production && terraform apply
```

### Quick setup script

Run from the `infra` directory to write the app credentials to `../.env.infra`, then copy the values into `.env`:

```bash
cat <<EOF > ../.env.infra
AWS_REGION=$(terraform output -raw aws_region)
AWS_ACCESS_KEY_ID=$(terraform output -raw access_key_id)
AWS_SECRET_ACCESS_KEY=$(terraform output -raw access_key_secret)
BUCKET_NAME=$(terraform output -raw bucket_id)
EMAIL_FROM=$(terraform output -raw ses_from_email)
EOF
```

### Backup service variables (production)

The Railway backup service (`../backup`) needs:

```bash
terraform workspace select production

BACKUP_BUCKET=$(terraform output -raw backups_bucket_id)
AWS_ACCESS_KEY_ID=$(terraform output -raw backup_user_access_key_id)
AWS_SECRET_ACCESS_KEY=$(terraform output -raw backup_user_access_key_secret)
AWS_REGION=$(terraform output -raw aws_region)
```

### SES identity

Terraform scopes the app user's SES sending to `*@<production_domain>`, but domain **verification** is not
provisioned here — verify the domain (or a single address) in the SES console and request production access
before launch.
