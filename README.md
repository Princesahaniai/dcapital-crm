# D-Capital CRM Pro (Ultimate Edition)

## 🚀 Quick Start

### Starting the Application

1. Open Terminal in the project folder
2. Run: `npm run dev`
3. Open browser to: `http://localhost:5173`

### Login Credentials

- **CEO Access:** `ajay@dcapitalrealestate.com`
- **Admin Access:** `admin@dcapitalrealestate.com`
- **Agent Access:** Any email ending in `@dcapitalrealestate.com`

---

## 📚 User Manual

### Dashboard (Command Center)

Your central hub showing:

- **Pipeline Value:** Total budget of all leads
- **Active Leads:** Current lead count
- **Pending Tasks:** Incomplete tasks
- **Conversion Rate:** Percentage of closed deals
- **Recent Activity:** Latest system actions
- **Premium Inventory:** Top 3 properties

### Leads CRM

**Add Lead:**

1. Click "+ Add Lead" button
2. Fill in: Name, Phone, Email, Budget, Source, Notes
3. Click "Save Lead"

**Edit Lead:**

1. Click blue Edit button on lead card
2. Modify any field
3. Update status: New → Qualified → Viewing → Negotiation → Deal Closed
4. Click "Update Lead"

**Export Leads:**

- Click "Export CSV" button
- Downloads: `DCAPITAL_LEADS_YYYY-MM-DD.csv`
- Open in Excel/Google Sheets

**WhatsApp Contact:**

- Click WhatsApp icon on lead card
- Opens WhatsApp with pre-filled message

### Inventory Control

**Add Property:**

1. Click "+ Add Listing" button
2. Fill in: Title, Location, Price, Beds, Status, Image URL
3. Click "Publish"

**Edit Property:**

1. Click blue Edit button
2. Modify details
3. Update status: Available → Reserved → Sold
4. Click "Update"

**Delete Property:**

- Click red Delete button
- Property removed immediately

**Share Property:**

- Click Share button
- Opens WhatsApp with property details

### Task Force

**Add Task:**

1. Type task in input field
2. Press **Enter** (no button needed)
3. Task appears at top

**Complete Task:**

- Click circle icon
- Task shows strikethrough and green checkmark

**Delete Task:**

- Click trash icon

### Settings

**Profile Management:**

1. Edit Display Name and Email
2. Click "Save Changes"

**Data Backup:**

1. Click "Backup Data"
2. Downloads: `DCAPITAL_BACKUP_YYYY-MM-DD.json`
3. Store safely

**Data Restore:**

1. Click "Restore Data"
2. Select backup JSON file
3. Confirm restoration

**Factory Reset:**

1. Click "Factory Reset" (Danger Zone)
2. Confirm action
3. All data cleared (profile kept)

---

## ⚠️ Important Notes

### Data Storage

- All data stored in **browser localStorage**
- Data is **device-specific**
- Clearing browser cache = **data loss**

### Best Practices

1. **Weekly Backups:** Export data every Friday
2. **Test Restores:** Verify backups work monthly
3. **Secure Storage:** Keep backup files safe
4. **Regular Updates:** Update lead statuses daily

### Troubleshooting

**Issue:** Data disappeared

- **Solution:** Restore from latest backup

**Issue:** Can't login

- **Solution:** Ensure email ends with `@dcapitalrealestate.com`

**Issue:** Changes not saving

- **Solution:** Check browser localStorage is enabled

---

## 🎯 Feature Summary

### Lead Management

- Add, Edit, Delete leads
- Export to CSV
- WhatsApp integration
- Status tracking
- Deal Closed highlighting

### Inventory Control

- Add, Edit, Delete properties
- Status management (Available/Reserved/Sold)
- WhatsApp sharing
- Visual property cards

### Task Management

- Quick-add with Enter key
- Toggle completion
- Delete tasks
- Visual states

### Analytics

- Pipeline value calculation
- Conversion rate tracking
- Activity feed
- Real-time metrics

### Data Safety

- JSON backup/restore
- Profile management
- Factory reset
- Data portability

---

## 🔒 Security

- **Local-only:** No server transmission
- **Role-based:** CEO, Admin, Agent access levels
- **Domain-restricted:** Only `@dcapitalrealestate.com` emails
- **User-controlled:** All backups managed by user

---

## 📞 Support

For technical issues or feature requests, contact your system administrator.

**Version:** Ultimate Edition (Feature Packs 1-4)
**Last Updated:** February 2026
