// R2直接アップロードテスト
const testR2Upload = async () => {
  try {
    console.log('Testing R2 direct upload...');
    
    // 1. 署名付きURLを取得
    const signResponse = await fetch('https://rt18-formula1-official-site.vercel.app/api/admin/upload', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': 'rt18_admin=1'
      },
      body: JSON.stringify({
        bucket: 'news-images',
        fileName: 'test.jpg',
        contentType: 'image/jpeg'
      })
    });
    
    if (!signResponse.ok) {
      throw new Error(`Failed to get presigned URL: ${signResponse.status}`);
    }
    
    const signed = await signResponse.json();
    console.log('Presigned URL obtained:', signed.uploadUrl.substring(0, 100) + '...');
    
    // 2. テスト用の画像データを作成
    const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNGヘッダー
    
    // 3. R2に直接PUT
    console.log('Uploading to R2...');
    const uploadResponse = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, POST, GET, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-MD5'
      },
      body: testData
    });
    
    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
    
    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      console.error('Upload failed:', text);
      throw new Error(`R2 upload failed: ${text} (${uploadResponse.status})`);
    }
    
    console.log('✅ Upload successful!');
    console.log('Public URL:', signed.url);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testR2Upload();
