
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

interface CreateFolderRequest {
  type: 'project' | 'payment_state';
  projectId: number;
  projectName: string;
  paymentStateName?: string;
  month?: string;
  year?: number;
  parentFolderId?: string;
}

async function getAccessToken(credentials: GoogleDriveCredentials): Promise<string> {
  console.log('🔑 Getting Google Drive access token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('❌ Failed to get access token:', data);
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  console.log('✅ Access token obtained successfully');
  return data.access_token;
}

async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  console.log('📁 Creating Google Drive folder:', folderName, parentFolderId ? `in parent: ${parentFolderId}` : 'in root');
  
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('❌ Failed to create folder:', data);
    throw new Error(`Failed to create folder: ${data.error?.message || 'Unknown error'}`);
  }

  console.log('✅ Google Drive folder created successfully:', data.id);
  return data.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Google Drive integration function called');
    const body: CreateFolderRequest = await req.json();
    console.log('📋 Request body:', body);
    
    // Get Google Drive credentials from Supabase secrets
    const googleClientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    console.log('🔍 Checking Google Drive credentials...');
    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      console.error('❌ Google Drive credentials not configured');
      throw new Error('Google Drive credentials not configured');
    }
    console.log('✅ Google Drive credentials found');

    const credentials: GoogleDriveCredentials = {
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: googleRefreshToken,
    };

    const accessToken = await getAccessToken(credentials);

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Supabase client initialized with service role');

    let folderId: string;
    let folderName: string;
    let fullUrl: string;

    if (body.type === 'project') {
      console.log('📁 Creating project folder...');
      // Create project folder: "ID proyecto - nombre proyecto"
      folderName = `${body.projectId} - ${body.projectName}`;
      folderId = await createGoogleDriveFolder(accessToken, folderName);
      fullUrl = `https://drive.google.com/drive/u/2/folders/${folderId}`;
      
      console.log(`📁 Project folder created: ${folderName} with ID: ${folderId}`);
      console.log(`🔗 Full URL: ${fullUrl}`);

      // Update project with Google Drive URL using service role client
      console.log('💾 Updating project with Google Drive URL...');
      const { error: updateProjectError } = await supabase
        .from('Proyectos')
        .update({ URL: fullUrl })
        .eq('id', body.projectId);

      if (updateProjectError) {
        console.error('❌ Error updating project URL:', updateProjectError);
        // Don't throw error here, just log it as the folder was created successfully
      } else {
        console.log('✅ Project updated with Google Drive URL');
      }

    } else if (body.type === 'payment_state') {
      console.log('📁 Creating payment state folder...');
      // Create payment state folder: "EP# - Mes Año"
      folderName = `${body.paymentStateName} - ${body.month} ${body.year}`;
      folderId = await createGoogleDriveFolder(accessToken, folderName, body.parentFolderId);
      fullUrl = `https://drive.google.com/drive/u/2/folders/${folderId}`;
      
      console.log(`📁 Payment state folder created: ${folderName} with ID: ${folderId}`);
      console.log(`🔗 Full URL: ${fullUrl}`);

      // Update the payment state record with the complete URL using service role client
      console.log('💾 Updating payment state with Google Drive URL...');
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ URL: fullUrl })
        .eq('Mes', body.month)
        .eq('Año', body.year)
        .eq('Project', body.projectId);

      if (updateError) {
        console.error('❌ Error updating payment state URL:', updateError);
        // Don't throw error here, just log it as the folder was created successfully
      } else {
        console.log('✅ Payment state updated with Google Drive URL');
      }
      
    } else {
      throw new Error('Invalid folder type');
    }

    // Fix existing URLs in database that only have folder IDs (using service role client)
    if (body.type === 'payment_state') {
      console.log('🔧 Fixing existing incomplete URLs in database...');
      
      // Get all payment states with URLs that don't start with https://
      const { data: paymentStates, error: fetchError } = await supabase
        .from('Estados de pago')
        .select('id, URL')
        .not('URL', 'is', null)
        .not('URL', 'like', 'https://%');

      if (fetchError) {
        console.error('❌ Error fetching payment states:', fetchError);
      } else if (paymentStates && paymentStates.length > 0) {
        console.log(`🔧 Found ${paymentStates.length} payment states with incomplete URLs`);
        
        // Update each one
        for (const state of paymentStates) {
          if (state.URL && !state.URL.startsWith('https://')) {
            const completeUrl = `https://drive.google.com/drive/u/2/folders/${state.URL}`;
            const { error: updateError } = await supabase
              .from('Estados de pago')
              .update({ URL: completeUrl })
              .eq('id', state.id);
            
            if (updateError) {
              console.error(`❌ Error updating URL for payment state ${state.id}:`, updateError);
            } else {
              console.log(`✅ Fixed URL for payment state ${state.id}: ${completeUrl}`);
            }
          }
        }
      }
    }

    console.log('🎉 Google Drive integration completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        folderId,
        folderName,
        fullUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error in Google Drive integration:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
