# Database backup resources: versioned bucket + a dedicated upload-only IAM user
# for the backup container (see ../backup). Created only in the production
# workspace — dev databases don't need backups.

locals {
  create_backup_resources = local.environment == "production"
  backups_bucket_name     = "${local.prefix}-database-backups"
}

module "backups_bucket" {
  count   = local.create_backup_resources ? 1 : 0
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket = local.backups_bucket_name

  attach_require_latest_tls_policy      = true
  attach_deny_insecure_transport_policy = true

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  # Retention: keep 30 days of dumps. Each backup is a uniquely named object, so
  # current-version expiration removes old dumps; noncurrent expiration cleans up
  # the versions left behind by versioning + expiration delete markers.
  lifecycle_rule = [
    {
      id      = "expire-old-backups"
      enabled = true
      filter  = {}

      expiration = {
        days = 30
      }

      noncurrent_version_expiration = {
        days = 1
      }
    }
  ]
}

module "backup_user" {
  count   = local.create_backup_resources ? 1 : 0
  source  = "terraform-aws-modules/iam/aws//modules/iam-user"
  version = "~> 6.0"

  name                 = "${local.prefix}-database-backup"
  create_login_profile = false

  policies = {
    s3_write = module.backup_user_s3_policy[0].arn
  }
}

data "aws_iam_policy_document" "backup_user_s3" {
  count = local.create_backup_resources ? 1 : 0

  statement {
    sid    = "AllowBackupUpload"
    effect = "Allow"

    actions = [
      "s3:PutObject",
    ]

    resources = [
      "arn:aws:s3:::${local.backups_bucket_name}/*",
    ]
  }
}

module "backup_user_s3_policy" {
  count   = local.create_backup_resources ? 1 : 0
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 6.0"

  name        = "${local.prefix}-database-backup-s3-write"
  description = "Allows the backup container to upload database dumps to S3."
  policy      = data.aws_iam_policy_document.backup_user_s3[0].json
}
