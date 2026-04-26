// APIデバッグ用スクリプト
const testAPI = async () => {
  try {
    console.log('Testing API endpoint...');
    
    // テスト用APIリクエスト
    const response = await fetch('https://rt18-formula1-official-site.vercel.app/api/admin/upload', {
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
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
  } catch (error) {
    console.error('API test failed:', error);
  }
};

testAPI();
