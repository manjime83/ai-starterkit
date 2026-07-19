terraform {
  required_version = ">= 1.15"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}


# Uploads bucket — private; browsers reach it only through presigned URLs, so CORS
# must allow the app origin(s) for the direct PUT/download flow.
module "uploads_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket = "${var.prefix}-uploads"

  attach_deny_insecure_transport_policy = true
  attach_require_latest_tls_policy      = true

  cors_rule = [
    {
      allowed_methods = ["GET", "PUT"]
      allowed_origins = var.bucket_allowed_origins
      allowed_headers = ["Content-Type", "Content-Disposition"]
      max_age_seconds = 3000
    }
  ]
}

# Object CRUD on the uploads bucket only; no bucket administration.
data "aws_iam_policy_document" "storage_s3_access" {
  statement {
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = [module.uploads_bucket.s3_bucket_arn]
  }

  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${module.uploads_bucket.s3_bucket_arn}/*"]
  }
}

module "storage_s3_access_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 6.0"

  name   = "${var.prefix}-storage-s3-access"
  policy = data.aws_iam_policy_document.storage_s3_access.json
}

# Send-only, scoped to exactly the app's From address. No SendRawEmail.
data "aws_iam_policy_document" "ses_send" {
  statement {
    actions   = ["ses:SendEmail"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [var.ses_from_email]
    }
  }
}

module "ses_send_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 6.0"

  name   = "${var.prefix}-ses-send"
  policy = data.aws_iam_policy_document.ses_send.json
}

# Single app user — carries both the storage and SES policies. The app's SES_* and
# BUCKET_* env pairs both hold this user's key pair.
module "app_user" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-user"
  version = "~> 6.0"

  name                 = "${var.prefix}-app"
  create_login_profile = false

  policies = {
    s3-access = module.storage_s3_access_policy.arn
    ses-send  = module.ses_send_policy.arn
  }
}
