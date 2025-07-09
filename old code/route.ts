import { NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { SERVER_MODELS } from '@/app/constants/models';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type CloudinaryCallback = (err?: UploadApiErrorResponse, result?: UploadApiResponse) => void;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Check if content type contains boundary
    if (!contentType.includes('boundary=')) {
      console.error('No boundary found in content type');
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      console.error('Error parsing FormData:', formDataError);
      return NextResponse.json({ 
        error: 'Failed to parse form data',
        details: formDataError instanceof Error ? formDataError.message : 'Unknown error'
      }, { status: 400 });
    }

    const file = formData.get('file');
    const uploadType = formData.get('uploadType');
    const bottomLine = formData.get('bottomLine');
    const modelId = formData.get('modelId');

    if (!file || !(file instanceof Blob)) {
      console.error('Missing or invalid file in request');
      return NextResponse.json({ error: 'Missing or invalid file' }, { status: 400 });
    }

    if (file.size === 0) {
      console.error('Empty file received');
      return NextResponse.json({ error: 'Empty file received' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Verify Cloudinary configuration
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const dataURI = `data:${file.type};base64,${buffer.toString('base64')}`;

      // Determine folder and filename based on upload type
      let folder = 'tshirt-designs';
      let fileName;
      let transformations: any[] = [{ fetch_format: 'auto', quality: 'auto' }];

      if (uploadType === 'tshirt-design') {
        if (!bottomLine || !modelId) {
          console.error('Missing required fields for tshirt-design:', { bottomLine, modelId });
          return NextResponse.json(
            { error: 'Missing required fields for tshirt design' },
            { status: 400 }
          );
        }

        const model = SERVER_MODELS.find(m => m.id === modelId);
        if (!model) {
          console.error('Invalid model ID:', modelId);
          return NextResponse.json(
            { error: 'Invalid model ID' },
            { status: 400 }
          );
        }

        // Clean up bottom line text for filename
        const cleanBottomLine = bottomLine.toString().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        fileName = `Famous_Since_${cleanBottomLine}_${model.name.replace(/\s+/g, '_')}`;

        transformations.push({ 
          width: 600,
          height: 750,
          quality: "auto",
          fetch_format: "auto",
          dpr: "2.0"
        });
      } else {
        console.error('Invalid upload type:', uploadType);
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
      }

      try {
        // Upload to Cloudinary
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader.upload(
            dataURI,
            {
              folder,
              resource_type: 'auto',
              public_id: fileName,
              transformation: transformations
            },
            ((err, result) => {
              if (err) {
                console.error('Cloudinary upload error:', {
                  error: err,
                  message: err.message,
                  http_code: err.http_code
                });
                reject(err);
              }
              else if (result) {
                const optimizedUrl = result.secure_url.replace(
                  '/upload/',
                  '/upload/f_auto,q_auto/'
                );
                resolve({ ...result, secure_url: optimizedUrl });
              } else {
                reject(new Error('No result returned from Cloudinary'));
              }
            }) as CloudinaryCallback
          );
        });

        return NextResponse.json(result);
      } catch (uploadError) {
        console.error('Error during Cloudinary upload:', {
          error: uploadError,
          message: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
        return NextResponse.json(
          { error: 'Failed to upload to Cloudinary', details: uploadError },
          { status: 500 }
        );
      }
    } catch (processError) {
      console.error('Error processing file:', {
        error: processError,
        message: processError instanceof Error ? processError.message : 'Unknown error'
      });
      return NextResponse.json(
        { error: 'Failed to process file', details: processError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in upload route:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to upload file', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 