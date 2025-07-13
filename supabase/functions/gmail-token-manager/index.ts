import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenResponse {
  valid: boolean;
  access_token?: string;
  expires_in?: number;
  error?: string;
  refresh_needed?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Gmail Token Manager started');
    
    const { action } = await req.json();
    
    // Get Gmail credentials
    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      console.error('❌ Missing Gmail credentials');
      return Response.json(
        { 
          valid: false, 
          error: 'Missing Gmail credentials',
          refresh_needed: true 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Gmail credentials found, attempting to get fresh token...');

    // Always get a fresh access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Failed to refresh Gmail token:', tokenData);
      
      // Check for specific error types
      if (tokenData.error === 'invalid_grant') {
        console.error('❌ Gmail refresh token is expired or revoked');
        return Response.json(
          { 
            valid: false, 
            error: 'Gmail refresh token expired or revoked. Please re-authenticate Gmail.',
            refresh_needed: true,
            error_code: 'GMAIL_REFRESH_TOKEN_EXPIRED'
          },
          { status: 401, headers: corsHeaders }
        );
      }

      return Response.json(
        { 
          valid: false, 
          error: `Gmail token refresh failed: ${tokenData.error_description || tokenData.error}`,
          refresh_needed: true 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('✅ Fresh Gmail access token obtained');

    // Test the token by making a simple API call to Gmail
    console.log('🧪 Testing Gmail token validity...');
    const testResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!testResponse.ok) {
      const testError = await testResponse.json();
      console.error('❌ Gmail token test failed:', testError);
      
      return Response.json(
        { 
          valid: false, 
          error: `Gmail token test failed: ${testError.error?.message || 'Unknown error'}`,
          refresh_needed: true 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const testData = await testResponse.json();
    console.log('✅ Gmail token is valid for:', testData.emailAddress || 'Unknown');

    // Return successful response
    const response: TokenResponse = {
      valid: true,
      access_token: accessToken,
      expires_in: tokenData.expires_in || 3600,
      refresh_needed: false
    };

    console.log('🎉 Gmail token validation completed successfully');
    
    return Response.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Unexpected error in Gmail token manager:', error);
    return Response.json(
      { 
        valid: false, 
        error: `Internal server error: ${error.message}`,
        refresh_needed: true 
      },
      { status: 500, headers: corsHeaders }
    );
  }
});