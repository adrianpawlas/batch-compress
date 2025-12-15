// Batch compress all uncompressed images
// Run with: node batch_compress.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yqawmzggcgpeyaaynrjk.supabase.co',
  process.env.SUPABASE_ANON_KEY // Add your anon key
);

async function batchCompress(batchSize = 5, delay = 1000) {
  console.log('Starting batch compression...');

  while (true) {
    // Get uncompressed products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, image_url')
      .is('compressed_image_url', null)
      .limit(batchSize);

    if (error) {
      console.error('Error fetching products:', error);
      break;
    }

    if (!products || products.length === 0) {
      console.log('All products compressed! 🎉');
      break;
    }

    console.log(`Processing ${products.length} products...`);

    for (const product of products) {
      try {
        console.log(`Compressing: ${product.title}`);

        const { data, error: compressError } = await supabase.functions.invoke('compress-images-free', {
          body: { action: 'compress_single', productId: product.id }
        });

        if (compressError) {
          console.error(`Failed to compress ${product.id}:`, compressError);
        } else {
          console.log(`✅ Compressed: ${product.title}`);
        }

        // Delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        console.error(`Error compressing ${product.id}:`, err.message);
      }
    }
  }

  console.log('Batch compression complete!');
}

// Run the batch compression
batchCompress(3, 2000); // 3 at a time, 2 second delay
