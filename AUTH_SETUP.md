# Hyriki Admin - Secure Authentication Setup

This guide covers the secure implementation of authentication with both email/password and Google OAuth using Supabase.

## 🔐 Security Features Implemented

### ✅ Authentication Methods
- **Email/Password Login** with validation and secure password handling
- **Magic Link Login** for passwordless authentication
- **Google OAuth** integration for social login
- **Password visibility toggle** for better UX
- **Forgot password functionality** with secure reset flow

### ✅ Security Measures
- **Server-Side Rendering (SSR)** with proper cookie handling
- **Middleware-based route protection** and session refresh
- **Input validation** and sanitization
- **CSRF protection** through Supabase's built-in security
- **Secure redirect validation** to prevent open redirect attacks
- **Rate limiting** through Supabase's built-in protection
- **Email confirmation** workflow (configurable)
- **Session management** with automatic refresh

## 🚀 Quick Setup

### 1. Environment Configuration

Copy the example environment file and configure your Supabase credentials:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Supabase Project Setup

1. **Create a Supabase project** at https://supabase.com/dashboard
2. **Get your credentials** from Settings > API
3. **Configure authentication providers** (see detailed steps below)

### 3. Google OAuth Setup

#### Step 3.1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Configure the consent screen with your app information
6. Set **Application type** to \"Web application\"
7. Add **Authorized redirect URIs**:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - Replace `your-project-id` with your actual Supabase project ID

#### Step 3.2: Supabase Configuration

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your **Google Client ID** and **Google Client Secret**
4. Save the configuration

### 4. Site URL Configuration

In Supabase dashboard, go to **Authentication** > **Settings**:

**Site URL:**
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

**Additional Redirect URLs:**
- `http://localhost:3000/auth/callback`
- `https://yourdomain.com/auth/callback`

## 🔧 Configuration Options

### Authentication Settings

In Supabase **Authentication** > **Settings**, configure:

- **Enable email confirmations**: Toggle based on your security requirements
- **Session timeout**: Set appropriate timeout (default: 1 hour)
- **Password requirements**: Configure minimum length and complexity
- **Enable/disable signups**: Control user registration

### Security Policies

Consider implementing Row Level Security (RLS) policies:

```sql
-- Example: Admin users table RLS policy
CREATE POLICY \"Admin users can only see their own data\" ON admin_user_info
FOR ALL USING (auth.uid() = user_id);
```

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use different Supabase projects for development/production
- Rotate API keys regularly in production

### 2. Password Security
- Minimum 6 characters (configurable in Supabase)
- Client-side validation with server-side enforcement
- Secure password reset flow with time-limited tokens

### 3. Session Management
- Automatic session refresh via middleware
- Secure cookie handling with HTTP-only flags
- Proper logout with session cleanup

### 4. OAuth Security
- Use `access_type: 'offline'` and `prompt: 'consent'` for Google OAuth
- Validate redirect URLs to prevent open redirect attacks
- Handle OAuth errors gracefully with user feedback

### 5. Input Validation
- Email format validation on client and server
- Sanitize all user inputs
- Rate limiting through Supabase's built-in protection

## 📱 Usage Examples

### Login Form Features

The implemented login form includes:

```typescript
// Toggle between password and magic link login
const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')

// Secure password handling
const [showPassword, setShowPassword] = useState(false)

// Comprehensive error handling
const [error, setError] = useState('')
const [message, setMessage] = useState('')

// Google OAuth integration
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}
```

### Protected Routes

Routes are automatically protected via middleware:

```typescript
// Protected paths require authentication
const protectedPaths = ['/dashboard', '/jobs', '/settings', '/help']

// Auth paths redirect if already logged in  
const authPaths = ['/login', '/signup']
```

## 🔍 Testing Authentication

### 1. Test Email/Password Login
1. Create a user account via signup
2. Confirm email if email confirmation is enabled
3. Test login with correct/incorrect credentials
4. Test password reset functionality

### 2. Test Magic Link Login
1. Enter email and select \"Magic Link\" method
2. Check email for login link
3. Click link to authenticate
4. Verify redirect to dashboard

### 3. Test Google OAuth
1. Click \"Continue with Google\" button
2. Complete Google OAuth flow
3. Verify account creation/login
4. Test subsequent logins

### 4. Test Route Protection
1. Try accessing `/dashboard` while logged out
2. Verify redirect to login page
3. Login and verify redirect to original page
4. Test logout functionality

## 🐛 Troubleshooting

### Common Issues

**1. Google OAuth not working:**
- Check redirect URIs in Google Cloud Console
- Verify client ID/secret in Supabase
- Ensure site URL is correctly configured

**2. Email confirmations not working:**
- Check email provider settings in Supabase
- Verify site URL configuration
- Check spam/junk folders

**3. Session not persisting:**
- Ensure middleware is properly configured
- Check cookie settings
- Verify environment variables

**4. Redirect issues:**
- Check middleware configuration
- Verify protected routes list
- Ensure proper error handling in callback

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
NODE_ENV=development
```

Check browser console and Supabase logs for detailed error information.

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## 🆘 Support

For issues related to this authentication implementation:

1. Check this documentation first
2. Review Supabase dashboard for auth logs
3. Check browser console for client-side errors
4. Verify environment configuration
5. Test with a fresh incognito/private browser session

---

**Security Note:** This implementation follows Supabase and Next.js security best practices. Always keep your dependencies updated and monitor for security advisories.