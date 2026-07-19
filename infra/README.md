# Infrastructure (Terraform)

Provisions everything the app needs on AWS: the private uploads bucket, a single **app IAM user** (storage +
SES-send policies), and — in production — the backups bucket and its upload-only IAM user.

## Layout

One root configuration applying one module; environments are just file pairs in `build/`:

```
main.tf / variables.tf / outputs.tf   ← backend, provider, module calls ("stack" always, "backups" prod-only)
build/
  dev.tfvars    + dev.s3.tfbackend    ← dev values + dev state key
  prod.tfvars   + prod.s3.tfbackend   ← prod values + prod state key
modules/
  stack/                              ← app resources: uploads bucket, app user + policies
  backups/                            ← backups bucket + upload-only user (instantiated only in prod)
```

| Environment | Var file            | Backend config            | Resource prefix      |
| ----------- | ------------------- | ------------------------- | -------------------- |
| dev         | `build/dev.tfvars`  | `build/dev.s3.tfbackend`  | `<project_name>-dev` |
| production  | `build/prod.tfvars` | `build/prod.s3.tfbackend` | `<project_name>`     |

Each backend config holds that environment's **state key** — this is what keeps the two environments in separate
state files. Never apply one environment's tfvars against the other's state: the plan would replace every resource.

## Before you apply

1. Edit `build/dev.tfvars` and `build/prod.tfvars` — `project_name`, `ses_from_email`, and `bucket_allowed_origins` — and
   the state `key` in both `build/*.s3.tfbackend` files (change per project).
2. `bucket_allowed_origins` must list **every** origin the app is served from **exactly** (complete origin, no trailing
   slash). Dev is `["http://localhost:3000"]`; production lists each real `https://` origin (e.g.
   `https://app.example.com` or the Railway-generated origin). It feeds S3 CORS for the browser's direct presigned
   PUT/download flow; a missing origin means browser uploads fail. No `www` hostname is assumed or derived.
3. The S3 state backend bucket in `main.tf` is org-specific (`nimbusit-terraform-state`); point the backend at your
   own bucket when forking into another org.

## Apply

```bash
# dev
terraform init -backend-config=build/dev.s3.tfbackend
terraform apply -var-file=build/dev.tfvars

# production (re-init switches the state file)
terraform init -reconfigure -backend-config=build/prod.s3.tfbackend
terraform apply -var-file=build/prod.tfvars
```

> Switching environments in the same checkout requires `terraform init -reconfigure -backend-config=...` — the
> backend (and therefore the state file) is fixed at init time, not at plan/apply time. Always pass the matching
> `-var-file`.

SES **verification is not provisioned** — verify the domain, enable DKIM, and request production access in the
SES console (STACK.md Step 28).

## Copy outputs into .env

```bash
./write-env.sh   # writes ../.env.infra from the currently initialized environment's state
```

The single app user's key pair fills both the `SES_*` and `BUCKET_*` variables.
