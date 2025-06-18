
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

interface CreateProjectRequest {
  type: 'create_project_with_payment_folders';
  projectId: number;
  projectName: string;
  paymentStates: Array<{
    id: number;
    Name: string;
    Mes: string;
    Año: number;
  }>;
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
  console.log('🔄 Obteniendo token de acceso...');
  
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
    console.error('❌ Error obteniendo access token:', data);
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  console.log('✅ Access token obtenido exitosamente');
  return data.access_token;
}

async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  console.log(`🔄 Creando carpeta en Google Drive: "${folderName}"${parentFolderId ? ` dentro de ${parentFolderId}` : ''}`);
  
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
    console.error('❌ Error creando carpeta:', data);
    throw new Error(`Failed to create folder: ${data.error?.message || 'Unknown error'}`);
  }

  console.log(`✅ Carpeta creada exitosamente: "${folderName}" con ID: ${data.id}`);
  return data.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando función de Google Drive...');
    
    const body: CreateProjectRequest | CreateFolderRequest = await req.json();
    console.log('📝 Datos recibidos:', JSON.stringify(body, null, 2));
    
    // Obtener credenciales de Google Drive desde secrets de Supabase
    const googleClientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    console.log('🔍 Verificando credenciales...');
    console.log('Client ID:', googleClientId ? '✅ Configurado' : '❌ Faltante');
    console.log('Client Secret:', googleClientSecret ? '✅ Configurado' : '❌ Faltante');
    console.log('Refresh Token:', googleRefreshToken ? '✅ Configurado' : '❌ Faltante');

    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      throw new Error('Google Drive credentials not configured. Missing: ' + 
        [
          !googleClientId && 'GOOGLE_DRIVE_CLIENT_ID',
          !googleClientSecret && 'GOOGLE_DRIVE_CLIENT_SECRET', 
          !googleRefreshToken && 'GOOGLE_DRIVE_REFRESH_TOKEN'
        ].filter(Boolean).join(', '));
    }

    const credentials: GoogleDriveCredentials = {
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: googleRefreshToken,
    };

    const accessToken = await getAccessToken(credentials);

    if (body.type === 'create_project_with_payment_folders') {
      console.log('📁 Creando proyecto completo con carpetas de estados de pago...');
      
      // Crear carpeta principal del proyecto
      const projectFolderName = `${body.projectId} - ${body.projectName}`;
      const projectFolderId = await createGoogleDriveFolder(accessToken, projectFolderName);
      
      console.log(`✅ Carpeta del proyecto creada: ${projectFolderName}`);

      // Crear carpetas para cada estado de pago
      const paymentFolders = [];
      for (const paymentState of body.paymentStates) {
        const paymentFolderName = `${paymentState.Name} - ${paymentState.Mes} ${paymentState.Año}`;
        const paymentFolderId = await createGoogleDriveFolder(
          accessToken, 
          paymentFolderName, 
          projectFolderId
        );
        
        paymentFolders.push({
          paymentStateId: paymentState.id,
          folderId: paymentFolderId,
          folderName: paymentFolderName
        });
        
        console.log(`✅ Carpeta de estado de pago creada: ${paymentFolderName}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          projectFolderId,
          projectFolderName,
          paymentFolders
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else {
      // Comportamiento original para tipos individuales
      let folderId: string;
      let folderName: string;

      if (body.type === 'project') {
        folderName = `${body.projectId} - ${body.projectName}`;
        folderId = await createGoogleDriveFolder(accessToken, folderName);
      } else if (body.type === 'payment_state') {
        folderName = `${body.paymentStateName} - ${body.month} ${body.year}`;
        folderId = await createGoogleDriveFolder(accessToken, folderName, body.parentFolderId);
      } else {
        throw new Error('Invalid folder type');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          folderId,
          folderName 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('💥 Error en función de Google Drive:', error);
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
