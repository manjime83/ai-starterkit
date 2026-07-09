# Application resources: private uploads bucket + IAM user for the app service.
# The app serves files exclusively through presigned URLs, so the bucket stays
# private; CORS is required for the browser's direct presigned PUT/GET.

module "uploads_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket = "${local.prefix}-uploads"

  attach_require_latest_tls_policy      = true
  attach_deny_insecure_transport_policy = true

  cors_rule = jsonencode([{
    allowed_origins = local.environment == "production" ? ["https://www.${var.production_domain}"] : ["http://localhost:3000"]
    allowed_methods = ["GET", "PUT"]
    allowed_headers = ["Content-Type"]
    max_age_seconds = 3600
  }])
}

module "app_user" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-user"
  version = "~> 6.0"

  name                 = "${local.prefix}-app"
  create_login_profile = false

  policies = {
    s3_access  = module.app_user_s3_policy.arn
    ses_access = module.app_user_ses_policy.arn
  }
}

data "aws_iam_policy_document" "app_user_s3" {
  statement {
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      module.uploads_bucket.s3_bucket_arn,
      "${module.uploads_bucket.s3_bucket_arn}/*",
    ]
  }
}

module "app_user_s3_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 6.0"

  name        = "${local.prefix}-app-s3-access"
  description = "Provides full access to the ${local.prefix}-uploads S3 bucket"
  policy      = data.aws_iam_policy_document.app_user_s3.json
}

data "aws_iam_policy_document" "app_user_ses" {
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "ses:FromAddress"
      values   = ["*@${var.production_domain}"]
    }
  }
}

module "app_user_ses_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 6.0"

  name        = "${local.prefix}-app-ses-send"
  description = "Allows the application user to send email through SES for ${var.production_domain}"
  policy      = data.aws_iam_policy_document.app_user_ses.json
}
