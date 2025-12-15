import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  image_url: string;
  compressed_image_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, productId, batchSize = 10 } = await req.json();

    if (action === 'compress_single' && productId) {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, image_url, compressed_image_url')
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.compressed_image_url) {
        return Response.json({ message: 'Already compressed', product });
      }

      const compressedUrl = await compressImageFree(product.image_url, supabase);

      const { error: updateError } = await supabase
        .from('products')
        .update({ compressed_image_url: compressedUrl })
        .eq('id', productId);

      if (updateError) throw updateError;

      return Response.json({ message: 'Compressed successfully', product: { ...product, compressed_image_url: compressedUrl } });

    } else if (action === 'compress_batch') {
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, image_url, compressed_image_url')
        .is('compressed_image_url', null)
        .limit(batchSize);

      if (fetchError) throw fetchError;

      const results = [];
      for (const product of products || []) {
        try {
          const compressedUrl = await compressImageFree(product.image_url, supabase);
          await supabase
            .from('products')
            .update({ compressed_image_url: compressedUrl })
            .eq('id', product.id);

          results.push({ id: product.id, success: true, compressedUrl });
        } catch (error) {
          results.push({ id: product.id, success: false, error: error.message });
        }
      }

      return Response.json({
        message: `Processed ${results.length} products`,
        results
      });
    }

    return Response.json({ error: 'Invalid action. Use "compress_single" or "compress_batch"' });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function compressImageFree(imageUrl: string, supabase: any): Promise<string> {
  try {
    // Option 1: Use a free image compression service
    // Resmush.it - completely free, no API key needed
    const resmushUrl = `https://api.resmush.it/ws.php?img=${encodeURIComponent(imageUrl)}&qlty=80`;

    const response = await fetch(resmushUrl);
    const data = await response.json();

    if (data.dest) {
      // Download the compressed image
      const compressedResponse = await fetch(data.dest);
      const compressedBuffer = await compressedResponse.arrayBuffer();

      // Upload to Supabase Storage
      const fileName = `compressed_${Date.now()}_${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`compressed/${fileName}`, compressedBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`compressed/${fileName}`);

      return publicUrlData.publicUrl;
    }

    throw new Error('Compression service returned no result');

  } catch (error) {
    console.error('Free compression failed:', error);
    // Option 2: Return original image if compression fails
    return imageUrl;
  }
}
