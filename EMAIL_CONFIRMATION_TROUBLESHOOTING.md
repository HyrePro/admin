# Email Confirmation Troubleshooting Guide

This guide helps resolve common issues with email confirmation in the Hyriki Admin application.

## Common Issues and Solutions

### 1. "Error sending confirmation email" Message

**Cause**: This typically occurs when:
- Supabase has reached its default email sending limit (2 emails per hour)
- No custom SMTP server is configured in Supabase
- The email address is invalid or blocked

**Solutions**:
1. **Wait and Retry**: If using Supabase's default email service, wait for the hourly limit to reset
2. **Configure Custom SMTP**: Set up a custom SMTP server in Supabase dashboard
3. **Verify Email Address**: Ensure the email address is valid and accessible

### 2. Not Receiving Confirmation Emails

**Troubleshooting Steps**:
1. Check spam/junk folders
2. Wait 2-3 minutes for email delivery
3. Verify the email address is correct
4. Try resending the confirmation email
5. Check if your email provider has strict filtering rules

### 3. Email Confirmation Not Working

**Troubleshooting Steps**:
1. Ensure you're clicking the complete verification link
2. Try opening the link in an incognito/private browser window
3. Clear browser cookies and cache
4. Try a different browser

## Supabase Email Configuration

### Default Email Service Limitations
- 2 emails per hour limit
- May be unreliable for production use
- No guarantee of delivery

### Recommended: Configure Custom SMTP

To configure a custom SMTP server:

1. **Choose an Email Service Provider**:
   - SendGrid (recommended)
   - Amazon SES
   - Mailgun
   - Postmark

2. **Get SMTP Credentials** from your chosen provider:
   - SMTP Host
   - SMTP Port
   - Username
   - Password/API Key

3. **Configure in Supabase Dashboard**:
   - Go to Authentication > Settings
   - Scroll to "SMTP Settings"
   - Enable "Enable Custom SMTP"
   - Enter your SMTP credentials
   - Save the configuration

4. **Test the Configuration**:
   - Try signing up a new user
   - Verify the email is received

## Manual Email Verification

If automated email sending continues to fail, you can manually verify a user:

1. **In Supabase SQL Editor**, run:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

2. **Alternative Method**:
   - Go to Authentication > Users in Supabase dashboard
   - Find the user
   - Manually set their email as confirmed

## Resending Confirmation Emails

Users can resend confirmation emails through:
1. The signup confirmation dialog (click "Resend verification email")
2. The login page (if they try to log in with an unconfirmed email)
3. The "Forgot Password" flow

## Support

If email confirmation issues persist:
1. Contact your email service provider
2. Check Supabase status at https://status.supabase.com
3. Reach out to Hyriki support at support@Hyriki.com