// functions/api/[[path]].js

async function handleImageRequest(request) {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');
    
    console.log("🖼️ handleImageRequest called, fileId:", fileId);
    
    if (!fileId) {
        return new Response(JSON.stringify({ error: 'Missing file id parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    try {
        const response = await fetch(driveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        });
        
        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch from Drive' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        
        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        const imageData = await response.arrayBuffer();
        
        console.log(`✅ Image fetched: ${contentType}, ${imageData.byteLength} bytes`);
        
        return new Response(imageData, {
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'public, max-age=86400',
                'Cross-Origin-Resource-Policy': 'cross-origin'
            }
        });
        
    } catch (error) {
        console.error("❌ Image proxy error:", error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    console.log("📍 Request:", request.method, url.pathname);
    
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    // ВАЖНО: проверяем оба возможных пути
    if (url.pathname === '/api/image' || url.pathname === '/image') {
        console.log("🖼️ Routing to image handler");
        return handleImageRequest(request);
    }
    
    // Прокси для Google Apps Script (все остальные запросы к /api)
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbwcpIH9cgwrQJ44iifU0NG-c2uXHTXLnEFefa5ZvokJChMMij8RzsV49YWzp-i8QksV/exec";
    
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of url.searchParams.entries()) {
        gsUrl.searchParams.append(key, value);
    }
    
    try {
        const fetchOptions = {
            method: request.method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };
        
        if (request.method === 'POST') {
            const bodyText = await request.text();
            if (bodyText) fetchOptions.body = bodyText;
        }
        
        const gsResponse = await fetch(gsUrl.toString(), fetchOptions);
        const responseText = await gsResponse.text();
        
        let responseBody = responseText;
        if (responseText.trim().startsWith('<')) {
            responseBody = JSON.stringify({ 
                error: 'Google Apps Script returned HTML', 
                details: responseText.substring(0, 200) 
            });
        }
        
        return new Response(responseBody, {
            status: gsResponse.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Proxy error', details: error.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
