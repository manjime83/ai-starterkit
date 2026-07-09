variable "project_name" {
  description = "The base name of the project, used to prefix and namespace resources."
  type        = string
}

variable "production_domain" {
  description = "Apex production domain for the project (without www). Used for SES email and S3 CORS."
  type        = string

  validation {
    condition     = length(var.production_domain) > 0
    error_message = "A production domain is required to scope SES sending and S3 CORS."
  }
}
