# Service Account Key Guide

## How to Get Your Firebase Service Account Key

This key is required to run the user creation script (`create-production-user.js`).

### Steps

1. **Visit Firebase Console**
   - Go to: <https://console.firebase.google.com/>
   - Select project: **dcapital-crm**

2. **Navigate to Settings**
   - Click the ⚙️ gear icon (top left)
   - Select **Project Settings**

3. **Go to Service Accounts**
   - Click the **Service Accounts** tab at the top

4. **Generate Key**
   - Scroll down to "Firebase Admin SDK"
   - Click **Generate New Private Key**
   - Confirm the dialog
   - A JSON file will download

5. **Save the File**
   - Rename it to: `serviceAccountKey.json`
   - Move it to: `scripts/serviceAccountKey.json`

### Security

⚠️ **NEVER commit this file to Git!**

Add to `.gitignore`:

```
scripts/serviceAccountKey.json
*.json
!package.json
```

### What's in the File

The service account key looks like this:

```json
{
  "type": "service_account",
  "project_id": "dcapital-crm",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-...@dcapital-crm.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

This gives the script **admin access** to your Firebase project.

### Troubleshooting

**Error: "ENOENT: no such file or directory"**

- Make sure `serviceAccountKey.json` is in the `scripts/` folder
- Check the file name is exactly correct

**Error: "Credential implementation provided has insufficient permissions"**

- You downloaded the wrong key
- Download the **Firebase Admin SDK** key, not a different service account

**Error: "Invalid service account"**

- The JSON file is corrupted
- Download a fresh key from Firebase Console
