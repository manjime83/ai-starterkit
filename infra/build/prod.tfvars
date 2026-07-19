# Prod environment — apply with:
#   terraform init -reconfigure -backend-config=build/prod.s3.tfbackend
#   terraform apply -var-file=build/prod.tfvars
environment            = "prod"
project_name           = "ai-starterkit"
ses_from_email         = "no-reply@nimbusit.us"
bucket_allowed_origins = ["https://sk.nimbusit.us"]
