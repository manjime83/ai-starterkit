output "bucket_id" {
  value = module.backups_bucket.s3_bucket_id
}

output "user_access_key_id" {
  value = module.backup_user.access_key_id
}

output "user_access_key_secret" {
  value     = module.backup_user.access_key_secret
  sensitive = true
}
