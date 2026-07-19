# Values come from build/<env>.tfvars.
variable "environment" {
  description = "Deployment environment — selected by the tfvars file (dev | prod)."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be \"dev\" or \"prod\"."
  }
}

variable "project_name" {
  description = "Short project slug used to prefix every resource name."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.project_name))
    error_message = "project_name must be a short lowercase slug (letters, digits, hyphens)."
  }
}

variable "ses_from_email" {
  description = "The From address the app sends email as (e.g. no-reply@example.com)."
  type        = string
}

variable "bucket_allowed_origins" {
  description = "Complete origins of the app (no trailing slash) — used only for S3 CORS."
  type        = list(string)
}
