output "bucket_id" {
  value = module.uploads_bucket.s3_bucket_id
}

# Single app user key pair — fills both the SES_* and BUCKET_* env pairs.
output "app_access_key_id" {
  value = module.app_user.access_key_id
}

output "app_secret_access_key" {
  value     = module.app_user.access_key_secret
  sensitive = true
}

output "ses_from_email" {
  value = var.ses_from_email
}
