output "aws_region" {
  value = "us-east-1"
}

output "bucket_id" {
  value = module.stack.bucket_id
}

# Single app user key pair — fills both the SES_* and BUCKET_* env pairs.
output "app_access_key_id" {
  value = module.stack.app_access_key_id
}

output "app_secret_access_key" {
  value     = module.stack.app_secret_access_key
  sensitive = true
}

output "ses_from_email" {
  value = module.stack.ses_from_email
}

# Production-only (null in dev — the backups module is not instantiated there)
output "backups_bucket_id" {
  value = one(module.backups[*].bucket_id)
}

output "backup_user_access_key_id" {
  value = one(module.backups[*].user_access_key_id)
}

output "backup_user_access_key_secret" {
  value     = one(module.backups[*].user_access_key_secret)
  sensitive = true
}
