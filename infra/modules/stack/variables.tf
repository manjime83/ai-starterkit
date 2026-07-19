variable "prefix" {
  description = "Resource name prefix — derived in the root (project name in prod, <project>-dev otherwise)."
  type        = string
}

variable "ses_from_email" {
  description = "The From address the app sends email as (e.g. no-reply@example.com). SES sending is scoped to exactly this address."
  type        = string

  validation {
    condition     = can(regex("^[^@\\s]+@[a-z0-9.-]+\\.[a-z]{2,}$", var.ses_from_email))
    error_message = "ses_from_email must be a full email address, e.g. no-reply@example.com."
  }
}

variable "bucket_allowed_origins" {
  description = "Complete origins of the app (no trailing slash) — used only for S3 CORS. Dev uses [\"http://localhost:3000\"]; production uses the real https:// origins."
  type        = list(string)

  validation {
    condition     = length(var.bucket_allowed_origins) > 0
    error_message = "bucket_allowed_origins must contain at least one origin."
  }

  validation {
    condition = alltrue([
      for origin in var.bucket_allowed_origins : can(regex("^(https://[a-z0-9.-]+(:[0-9]+)?|http://localhost(:[0-9]+)?)$", origin))
    ])
    error_message = "Each origin must be a complete https:// origin (or http://localhost[:port]) with no trailing slash."
  }
}
