# Roomy Notification System

## Overview
The Roomy platform provides a comprehensive **bilingual** notification system that alerts dorm owners about important updates via **Email** and **WhatsApp** in their preferred language (English or Arabic).

## Supported Languages

### English (EN)
- Default for international phone numbers
- Standard Latin script
- Left-to-right text direction

### Arabic (AR)
- Default for Lebanese phone numbers (+961)
- Arabic script with proper UTF-8 encoding
- Right-to-left text direction
- Localized for Lebanese market

## Supported Notification Types

### 1. Verification Notification
Triggered when an admin verifies a dorm listing, making it visible to students.
- **Event Type:** `verified`
- **Channels:** Email + WhatsApp (optional)
- **Content:** Confirmation that the listing is now live

### 2. Update Notification
Triggered when significant fields of a verified listing are changed by an admin.
- **Event Type:** `edited`
- **Monitored Fields:**
  - Monthly price
  - Services & amenities
  - Area
  - Room types
  - Phone number
  - Email
  - Website
- **Channels:** Email + WhatsApp (optional)
- **Content:** Summary of changed fields with old → new values

### 3. Inquiry Notification
Triggered when a student sends an inquiry about a listing.
- **Event Type:** `inquiry`
- **Channels:** Email + WhatsApp (optional)
- **Content:** Student's message and contact information

## Notification Channels

### Email (via Resend)
- **From:** Roomy Support <onboarding@resend.dev>
- **Rate Limit:** 5 emails per hour per owner
- **Debounce:** 2 minutes for identical events
- **Templates:** HTML emails with branded design

### WhatsApp (via Twilio)
- **Rate Limit:** 3 messages per hour per owner
- **Debounce:** 10 minutes for identical events
- **Language Support:** 
  - English (EN) - Default for international numbers
  - Arabic (AR) - Default for Lebanese numbers (+961)
  - Owner-selectable in account settings
- **Templates:** Bilingual message templates for all event types
- **Requirements:** Owner must have valid phone number in international format
- **Encoding:** UTF-8 support for Arabic characters

## Owner Preferences

Owners can control their notification preferences from `/owner/account`:

1. **Email Notifications** (`notify_email`)
   - Toggle: "Email me about listing updates"
   - Default: Enabled

2. **WhatsApp Notifications** (`notify_whatsapp`)
   - Toggle: "Receive WhatsApp alerts"
   - Language: English (🇬🇧) or Arabic (🇱🇧)
   - Auto-detection: Lebanese numbers (+961) default to Arabic
   - Default: Enabled
   - Requires: Valid phone number

## Database Schema

### `owners` Table Extensions
```sql
notify_email: boolean (default: true)
notify_whatsapp: boolean (default: true)
whatsapp_language: text (EN | AR, default: EN)
```

### `notifications_log` Table
Tracks all notification attempts:
```sql
id: uuid (pk)
dorm_id: uuid
owner_id: uuid
event_type: text (verified | edited | inquiry)
fields_changed: jsonb
sent_to: text (email address)
sent_at: timestamptz
status: text (pending | sent | failed | skipped)
error_message: text
retry_count: integer
channel: text (email | whatsapp | both)
language: text (EN | AR, default: EN)
```

### `inquiries` Table
Tracks student inquiries:
```sql
id: uuid (pk)
dorm_id: uuid
student_id: uuid
owner_id: uuid
inquiry_type: text (chatbot | contact_form | direct)
message: text
student_name: text
student_email: text
student_phone: text
created_at: timestamptz
status: text (new | viewed | responded | closed)
```

## Rate Limiting & Safety

### Email Rate Limits
- **Max:** 5 emails per hour per owner
- **Debounce:** 2 minutes for duplicate events
- **Function:** `check_notification_rate_limit(owner_id)`

### WhatsApp Rate Limits
- **Max:** 3 messages per hour per owner
- **Debounce:** 10 minutes for duplicate events
- **Function:** `check_whatsapp_rate_limit(owner_id)`

### Fallback Behavior
If a notification channel fails:
1. Error is logged to `notifications_log.error_message`
2. Status set to `failed`
3. Retry count incremented
4. Automatic retry every 15 minutes (max 3 attempts)

## Edge Functions

### `send-owner-notification`
Sends individual notifications via email and/or WhatsApp.
- **Trigger:** Called with notification ID
- **Logic:**
  1. Fetch notification details from database
  2. Check owner preferences
  3. Send via configured channels
  4. Update status in database

### `process-pending-notifications`
Batch processes pending and failed notifications.
- **Schedule:** Every 15 minutes (pg_cron)
- **Logic:**
  1. Fetch pending/failed notifications (retry_count < 3)
  2. Invoke `send-owner-notification` for each
  3. Update status based on results

## Admin Dashboard

### Notification Logs (`/admin/notifications`)
View and manage all notifications:
- **Filters:**
  - Status (sent | failed | pending | skipped)
  - Event type (verified | edited | inquiry)
  - Channel (email | whatsapp | both)
  - Language (EN | AR)
- **Actions:**
  - Retry failed notifications
  - View error messages
  - Monitor success rates by language
- **Language Indicators:**
  - 🇬🇧 EN - English messages
  - 🇱🇧 AR - Arabic messages

### Statistics
- Total notifications sent
- Success rate by channel
- Failed notifications count
- Pending notifications count

## Testing Checklist

✅ **Verification Flow**
1. Admin verifies a dorm
2. Owner receives email + WhatsApp (if enabled)
3. Notification logged with status "sent"

✅ **Update Flow**
1. Admin changes monthly_price
2. Owner receives update notification
3. Changed fields shown in message

✅ **Inquiry Flow**
1. Student submits inquiry via chatbot
2. Owner receives notification immediately
3. Inquiry visible in owner dashboard

✅ **Rate Limits**
1. Send 6 emails within an hour → 6th is skipped
2. Send 4 WhatsApp within an hour → 4th is skipped
3. Skipped notifications logged with reason

✅ **Language Selection**
1. Owner with +961 number → automatically defaults to Arabic
2. Owner changes language to English → next message in English
3. Owner changes to Arabic → messages show in Arabic with proper RTL formatting

✅ **Opt-Out**
1. Owner disables `notify_email` → no emails sent
2. Owner disables `notify_whatsapp` → no WhatsApp sent
3. Both disabled → no notifications, logged as skipped

## Adding New Notification Types

To add a new event type:

1. **Update Database Trigger**
   ```sql
   -- Add condition in queue_owner_notification()
   IF <new_condition> THEN
     should_notify := true;
     event_type_val := 'new_event_type';
     fields_diff := jsonb_build_object(...);
   END IF;
   ```

2. **Update Edge Function**
   ```typescript
   // Add new template in send-owner-notification/index.ts
   const whatsappTemplates: WhatsAppTemplates = {
     ...
     new_event_type: {
       EN: "English template with {{variables}}",
       AR: "Arabic template with {{variables}}"
     }
   };
   ```

3. **Update UI Filters**
   ```tsx
   // Add to AdminNotifications.tsx
   <SelectItem value="new_event_type">New Event Type</SelectItem>
   ```

## Security Considerations

- All notification logic runs server-side with `SECURITY DEFINER`
- No sensitive data exposed in notifications beyond listing details
- All dynamic values sanitized before templating
- Rate limits prevent abuse and spam
- Twilio credentials stored as secrets (never in code)
- UTF-8 encoding ensures proper Arabic character rendering
- Language preference stored securely in database
- Auto-detection based on phone number prefix for better UX

## Environment Variables

Required secrets:
- `RESEND_API_KEY` - Resend.com API key for email
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` - Twilio WhatsApp number (format: +1234567890)

## Support

For issues or questions:
- Contact: +961 81 858 026
- Email: support@roomy.ai
- Dashboard: https://main-roomy.lovable.app/admin
