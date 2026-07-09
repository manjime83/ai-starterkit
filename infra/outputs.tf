output "aws_region" {
  description = "AWS region all resources live in."
  value       = data.aws_region.current.region
}

output "access_key_id" {
  description = "AWS IAM Access Key ID for the application user."
  value       = module.app_user.access_key_id
}

output "access_key_secret" {
  description = "AWS IAM Secret Access Key for the application user."
  value       = module.app_user.access_key_secret
  sensitive   = true
}

output "bucket_id" {
  description = "The name/ID of the uploads S3 bucket."
  value       = module.uploads_bucket.s3_bucket_id
}

output "ses_from_email" {
  description = "Default From address for SES email delivery."
  value       = "no-reply@${var.production_domain}"
}

output "backups_bucket_id" {
  description = "The name/ID of the database backups S3 bucket (production only)."
  value       = local.create_backup_resources ? module.backups_bucket[0].s3_bucket_id : null
}

output "backup_user_access_key_id" {
  description = "AWS access key ID for the backup container (production only)."
  value       = local.create_backup_resources ? module.backup_user[0].access_key_id : null
}

output "backup_user_access_key_secret" {
  description = "AWS secret access key for the backup container (production only)."
  value       = local.create_backup_resources ? module.backup_user[0].access_key_secret : null
  sensitive   = true
}
