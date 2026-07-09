terraform {
  backend "s3" {
    region       = "us-east-1"
    bucket       = "nimbusit-terraform-state"
    key          = "ai-starterkit/terraform.tfstate" # change per project
    use_lockfile = true
  }

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace
  prefix      = local.environment == "production" ? var.project_name : "${var.project_name}-${local.environment}"
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = local.environment
    }
  }
}

data "aws_region" "current" {}
