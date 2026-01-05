import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateFolderRequest {
  type: 'project' | 'payment_state' | 'project_docs' | 'project-photos';
  projectId: number;
  projectName?: string;
  paymentStateName?: string;
  month?: string;
  year?: number;
  parentFolderId?: string;
}

async function getAccessToken(): Promise<string> {
  console.log('🔑 Getting Google Drive access token via token manager...');
  
  const tokenManagerResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-token-manager`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify({ action: 'validate' }),
  });

  if (!tokenManagerResponse.ok) {
    const errorText = await tokenManagerResponse.text();
    console.error('❌ Token manager HTTP error:', tokenManagerResponse.status, errorText);
    throw new Error(`Token manager request failed: ${tokenManagerResponse.status}`);
  }

  const tokenResult = await tokenManagerResponse.json();

  if (!tokenResult.valid) {
    console.error('❌ Token validation failed:', tokenResult.error);
    throw new Error(`Google Drive authentication failed: ${tokenResult.error}`);
  }

  console.log('✅ Access token obtained and validated successfully');
  return tokenResult.access_token;
}

async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; url: string }> {
  console.log('📁 Creating folder:', folderName, parentFolderId ? `in parent: ${parentFolderId}` : 'in root');
  
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

  console.log('✅ Folder created successfully:', data.id);
  
  const url = `https://drive.google.com/drive/u/2/folders/${data.id}`;
  return { id: data.id, url };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Integration function called');
    const body: CreateFolderRequest = await req.json();
    console.log('📋 Request body:', body);
    
    const accessToken = await getAccessToken();

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Supabase client initialized with service role');

    let folderId: string;
    let folderName: string;
    let fullUrl: string;

    if (body.type === 'project') {
      console.log('📁 Creating project folder with subfolders...');
      
      // Get project name if not provided
      let projectName = body.projectName;
      if (!projectName) {
        const { data: project } = await supabase
          .from('Proyectos')
          .select('Name')
          .eq('id', body.projectId)
          .single();
        projectName = project?.Name || `Proyecto_${body.projectId}`;
      }
      
      // Create main project folder: "ID proyecto - nombre proyecto"
      folderName = `${body.projectId} - ${projectName}`;
      const mainFolder = await createGoogleDriveFolder(accessToken, folderName);
      folderId = mainFolder.id;
      fullUrl = mainFolder.url;
      
      console.log(`📁 Main project folder created: ${folderName} with ID: ${folderId}`);
      console.log(`🔗 Full URL: ${fullUrl}`);

      // Create 4 subfolders in parallel: Documentos, Fotos, RFI, Adicionales
      console.log('📁 Creating 4 subfolders...');
      const subfolderPromises = [
        createGoogleDriveFolder(accessToken, 'Documentos', folderId),
        createGoogleDriveFolder(accessToken, 'Fotos', folderId),
        createGoogleDriveFolder(accessToken, 'RFI', folderId),
        createGoogleDriveFolder(accessToken, 'Adicionales', folderId),
      ];
      
      const [docsFolder, fotosFolder, rfiFolder, adicionalesFolder] = await Promise.all(subfolderPromises);
      
      console.log('✅ All subfolders created:', {
        documentos: docsFolder.url,
        fotos: fotosFolder.url,
        rfi: rfiFolder.url,
        adicionales: adicionalesFolder.url,
      });

      // Update project with all folder URLs
      console.log('💾 Updating project with all URLs...');
      const { error: updateProjectError } = await supabase
        .from('Proyectos')
        .update({ 
          URL: fullUrl,
          URL_docs: docsFolder.url,
          URL_Fotos: fotosFolder.url,
          URL_RFI: rfiFolder.url,
          URL_Ad: adicionalesFolder.url,
        })
        .eq('id', body.projectId);

      if (updateProjectError) {
        console.error('❌ Error updating project URLs:', updateProjectError);
      } else {
        console.log('✅ Project updated with all URLs');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          folderId,
          folderName,
          fullUrl,
          subfolders: {
            documentos: docsFolder.url,
            fotos: fotosFolder.url,
            rfi: rfiFolder.url,
            adicionales: adicionalesFolder.url,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (body.type === 'project_docs') {
      console.log('📁 Creating project documents folder...');
      
      // Get project info
      const { data: project } = await supabase
        .from('Proyectos')
        .select('Name, URL')
        .eq('id', body.projectId)
        .single();
      
      const projectName = body.projectName || project?.Name || `Proyecto_${body.projectId}`;
      
      // Check if project has main folder, use it as parent
      let parentFolderId: string | undefined;
      if (project?.URL) {
        const match = project.URL.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match) {
          parentFolderId = match[1];
        }
      }
      
      // Create folder name based on whether it's inside main folder or standalone
      folderName = parentFolderId ? 'Documentos' : `Documentos - ${body.projectId} - ${projectName}`;
      const folder = await createGoogleDriveFolder(accessToken, folderName, parentFolderId);
      folderId = folder.id;
      fullUrl = folder.url;
      
      console.log(`📁 Project documents folder created: ${folderName} with ID: ${folderId}`);
      console.log(`🔗 Full URL: ${fullUrl}`);

      // Update project with documents URL
      console.log('💾 Updating project with documents URL...');
      const { error: updateProjectError } = await supabase
        .from('Proyectos')
        .update({ URL_docs: fullUrl })
        .eq('id', body.projectId);

      if (updateProjectError) {
        console.error('❌ Error updating project documents URL:', updateProjectError);
      } else {
        console.log('✅ Project updated with documents URL');
      }

    } else if (body.type === 'project-photos') {
      console.log('📁 Creating project photos folder...');
      
      // Get project info
      const { data: project } = await supabase
        .from('Proyectos')
        .select('Name, URL')
        .eq('id', body.projectId)
        .single();
      
      const projectName = body.projectName || project?.Name || `Proyecto_${body.projectId}`;
      
      // Check if project has main folder, use it as parent
      let parentFolderId: string | undefined;
      if (project?.URL) {
        const match = project.URL.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match) {
          parentFolderId = match[1];
        }
      }
      
      // Create folder name based on whether it's inside main folder or standalone
      folderName = parentFolderId ? 'Fotos' : `Fotos - ${body.projectId} - ${projectName}`;
      const folder = await createGoogleDriveFolder(accessToken, folderName, parentFolderId);
      folderId = folder.id;
      fullUrl = folder.url;
      
      console.log(`📁 Project photos folder created: ${folderName} with ID: ${folderId}`);
      console.log(`🔗 Full URL: ${fullUrl}`);

      // Update project with photos URL
      console.log('💾 Updating project with photos URL...');
      const { error: updateProjectError } = await supabase
        .from('Proyectos')
        .update({ URL_Fotos: fullUrl })
        .eq('id', body.projectId);

      if (updateProjectError) {
        console.error('❌ Error updating project photos URL:', updateProjectError);
      } else {
        console.log('✅ Project updated with photos URL');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          folderId,
          folderName,
          folderUrl: fullUrl,
          fullUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (body.type === 'payment_state') {
      console.log('📁 Creating payment state folder...');
      // Create payment state folder: "EP# - Mes Año"
      folderName = `${body.paymentStateName} - ${body.month} ${body.year}`;
      const folder = await createGoogleDriveFolder(accessToken, folderName, body.parentFolderId);
      folderId = folder.id;
      fullUrl = folder.url;
      
      console.log(`📁 Payment state folder created: ${folderName} with ID: ${folderId}`);
      console.log(`🔗 Full URL: ${fullUrl}`);

      // Update the payment state record with the complete URL
      console.log('💾 Updating payment state with URL...');
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ URL: fullUrl })
        .eq('Mes', body.month)
        .eq('Año', body.year)
        .eq('Project', body.projectId);

      if (updateError) {
        console.error('❌ Error updating payment state URL:', updateError);
      } else {
        console.log('✅ Payment state updated with URL');
      }
      
      // Fix existing URLs in database that only have folder IDs
      console.log('🔧 Fixing existing incomplete URLs in database...');
      
      const { data: paymentStates, error: fetchError } = await supabase
        .from('Estados de pago')
        .select('id, URL')
        .not('URL', 'is', null)
        .not('URL', 'like', 'https://%');

      if (fetchError) {
        console.error('❌ Error fetching payment states:', fetchError);
      } else if (paymentStates && paymentStates.length > 0) {
        console.log(`🔧 Found ${paymentStates.length} payment states with incomplete URLs`);
        
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
      
    } else {
      throw new Error('Invalid folder type');
    }

    console.log('🎉 Integration completed successfully');
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
    console.error('❌ Error in integration:', error);
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
