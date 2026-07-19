terraform {
  required_version = ">= 1.15"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    # Org-specific shared state bucket — point at your own bucket when forking this kit.
    bucket = "nimbusit-terraform-state"
    # The state `key` is per environment: pass it at init time via
    # `terraform init -backend-config=build/<env>.s3.tfbackend`.
    region       = "us-east-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
    }
  }
}

locals {
  prefix = var.environment == "prod" ? var.project_name : "${var.project_name}-dev"
}

module "stack" {
  source = "./modules/stack"

  prefix                 = local.prefix
  ses_from_email         = var.ses_from_email
  bucket_allowed_origins = var.bucket_allowed_origins
}

# Database backups exist only in prod.
module "backups" {
  source = "./modules/backups"

  count = var.environment == "prod" ? 1 : 0

  prefix = local.prefix
}
