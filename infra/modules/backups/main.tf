terraform {
  required_version = ">= 1.15"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Database backup storage. The lifecycle rule IS the retention mechanism — the
# backup container only ever uploads, never lists or deletes.
module "backups_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket = "${var.prefix}-database-backups"

  attach_deny_insecure_transport_policy = true
  attach_require_latest_tls_policy      = true

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  lifecycle_rule = [
    {
      id      = "expire-backups"
      enabled = true

      expiration = {
        days = 30
      }
    }
  ]
}

data "aws_iam_policy_document" "backup_put" {
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${module.backups_bucket.s3_bucket_arn}/*"]
  }
}

module "backup_put_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 6.0"

  name   = "${var.prefix}-database-backup-put"
  policy = data.aws_iam_policy_document.backup_put.json
}

module "backup_user" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-user"
  version = "~> 6.0"

  name                 = "${var.prefix}-database-backup"
  create_login_profile = false

  policies = {
    put-only = module.backup_put_policy.arn
  }
}
