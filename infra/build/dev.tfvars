# Dev environment — apply with:
#   terraform init -reconfigure -backend-config=build/dev.s3.tfbackend
#   terraform apply -var-file=build/dev.tfvars
environment            = "dev"
project_name           = "ai-starterkit"
ses_from_email         = "no-reply@nimbusit.us"
bucket_allowed_origins = ["http://localhost:3000"]
