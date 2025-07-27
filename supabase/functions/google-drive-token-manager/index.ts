
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenInfo {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
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
    console.log('🔑 Google Drive Token Manager started');
    
    const { action } = await req.json();
    
    // Get Google Drive credentials and clean them
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')?.trim();
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')?.trim();
    const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN')?.trim();

    if (!clientId || !clientSecret || !refreshToken) {
      console.error('❌ Missing Google Drive credentials');
      return Response.json(
        { 
          valid: false, 
          error: 'Missing Google Drive credentials',
          refresh_needed: true 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Credentials found, attempting to get fresh token...');

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
      console.error('❌ Failed to refresh token:', tokenData);
      
      // Check for specific error types
      if (tokenData.error === 'invalid_grant') {
        console.error('❌ Refresh token is expired or revoked');
        return Response.json(
          { 
            valid: false, 
            error: 'Refresh token expired or revoked. Please re-authenticate Google Drive.',
            refresh_needed: true,
            error_code: 'REFRESH_TOKEN_EXPIRED'
          },
          { status: 401, headers: corsHeaders }
        );
      }

      return Response.json(
        { 
          valid: false, 
          error: `Token refresh failed: ${tokenData.error_description || tokenData.error}`,
          refresh_needed: true 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('✅ Fresh access token obtained');

    // Test the token by making a simple API call to Google Drive
    console.log('🧪 Testing token validity...');
    const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!testResponse.ok) {
      const testError = await testResponse.json();
      console.error('❌ Token test failed:', testError);
      
      return Response.json(
        { 
          valid: false, 
          error: `Token test failed: ${testError.error?.message || 'Unknown error'}`,
          refresh_needed: true 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const testData = await testResponse.json();
    console.log('✅ Token is valid for user:', testData.user?.displayName || 'Unknown');

    // Return successful response
    const response: TokenResponse = {
      valid: true,
      access_token: accessToken,
      expires_in: tokenData.expires_in || 3600,
      refresh_needed: false
    };

    console.log('🎉 Token validation completed successfully');
    
    return Response.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Unexpected error in token manager:', error);
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
