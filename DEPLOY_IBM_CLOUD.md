# Deployment Guide: IBM Cloud Code Engine

All deployment assets have been created in this repository adhering to IBM security standards:
- `Dockerfile` (Multi-stage build using Red Hat UBI minimal images & non-root user execution `1001`)
- `nginx.conf` (Nginx configuration with SPA routing fallback `try_files` and static caching)
- `.dockerignore` (Excludes `node_modules`, `dist`, logs, and sensitive files)

---

## Method 1: Deploy Directly from Git (No local CLI required)

If your code is pushed to an enterprise Git repository (e.g., GitHub, IBM GitHub Enterprise, GitLab):

1. **Go to IBM Cloud Console**:
   - Navigate to [IBM Cloud Code Engine](https://cloud.ibm.com/codeengine/overview).
2. **Create / Open a Project**:
   - Click **Projects** &rarr; **Create** (e.g., `approval-intelligence-center`).
3. **Create an Application**:
   - Go to **Applications** &rarr; **Create**.
   - **Name**: `approval-intelligence`
   - **Code**: Select **Source code**.
   - **Source repository URL**: Paste your repository URL.
   - **Build strategy**: `Dockerfile`.
   - **Listening port**: `8080`.
4. Click **Create & Deploy**. Code Engine will build the container in the cloud using the [`Dockerfile`](Dockerfile) and provide a live URL (`https://...codeengine.appdomain.cloud`).

---

## Method 2: Deploy using IBM Cloud CLI

If you have the IBM Cloud CLI installed on your machine:

1. **Login and set target**:
   ```bash
   ibmcloud login --sso
   ibmcloud target -g <YOUR_RESOURCE_GROUP> -r <YOUR_REGION>
   ```

2. **Ensure Code Engine and Container Registry plugins are installed**:
   ```bash
   ibmcloud plugin install code-engine
   ibmcloud plugin install container-registry
   ```

3. **Build image on IBM Cloud Container Registry**:
   ```bash
   ibmcloud cr namespace-add approval-center
   ibmcloud cr build -t us.icr.io/approval-center/app:latest .
   ```

4. **Deploy application to Code Engine**:
   ```bash
   ibmcloud ce project create --name approval-center-proj
   ibmcloud ce project select --name approval-center-proj

   ibmcloud ce app create \
     --name approval-intelligence-center \
     --image us.icr.io/approval-center/app:latest \
     --registry-secret ce-auto-icr-us-south \
     --port 8080 \
     --min-scale 1 \
     --visibility public
   ```

---

## Method 3: Binding a Custom IBM Subdomain (`*.ibm.com`)

1. In the Code Engine project console, go to **Domain mappings** &rarr; **Create**.
2. Enter your approved IBM domain (e.g., `approvals.ibm.com` or `approvals.stage1.ibm.com`).
3. Choose the target application (`approval-intelligence-center`) and provide the TLS certificate/secret.
4. Add the generated CNAME record in your IBM DNS / ServiceNow domain registry.
