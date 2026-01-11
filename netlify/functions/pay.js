const https = require('https');

exports.handler = async function(event, context) {
    // 1. SECURITY CHECK: Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 2. GET DATA FROM FRONTEND
    // We expect the amount, name, email, and specifically the phone number
    const { amount, email, name, phone } = JSON.parse(event.body);

    // 3. SETUP ENVIRONMENT (Live vs Sandbox)
    // If PESAPAL_ENV is set to 'live' in Netlify, we use the real URL.
    const isLive = process.env.PESAPAL_ENV === 'live';
    const hostname = isLive ? 'pay.pesapal.com' : 'cybqa.pesapal.com';
    const apiPath = isLive ? '/v3/api' : '/pesapalv3/api';

    try {
        // ==================================================
        // STEP A: GET ACCESS TOKEN (Log in to Pesapal)
        // ==================================================
        const token = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: hostname,
                path: `${apiPath}/Auth/RequestToken`,
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json' 
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 400) reject(new Error(`Auth Failed: ${data}`));
                    else resolve(JSON.parse(data).token);
                });
            });
            
            req.on('error', (e) => reject(e));
            req.write(JSON.stringify({
                consumer_key: process.env.PESAPAL_CONSUMER_KEY,
                consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
            }));
            req.end();
        });

        // ==================================================
        // STEP B: REGISTER IPN (Instant Payment Notification)
        // ==================================================
        // This tells Pesapal where to send the "Payment Successful" signal.
        // We use the main site URL as a placeholder for this serverless setup.
        const ipnId = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: hostname,
                path: `${apiPath}/URLSetup/RegisterIPN`,
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const parsed = JSON.parse(data);
                    if (parsed.error) reject(new Error(`IPN Error: ${parsed.error.message}`));
                    else resolve(parsed.ipn_id);
                });
            });
            
            req.write(JSON.stringify({
                url: "https://hatuainnovationstudioke.netlify.app/ipn", // Dummy endpoint for now
                ipn_notification_type: "GET"
            }));
            req.end();
        });

        // ==================================================
        // STEP C: SUBMIT ORDER (Get the Payment Link)
        // ==================================================
        const redirectUrl = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: hostname,
                path: `${apiPath}/Transactions/SubmitOrderRequest`,
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const parsed = JSON.parse(data);
                    if (parsed.error) reject(new Error(`Order Error: ${parsed.error.message}`));
                    else resolve(parsed.redirect_url);
                });
            });

            // Create a unique Order ID
            const reference = "HATUA-" + Date.now(); 

            // Payload: This is where we pass the Phone Number for M-Pesa
            req.write(JSON.stringify({
                id: reference,
                currency: "KES",
                amount: amount,
                description: "Hatua FutureTech Store",
                callback_url: "https://hatuainnovationstudioke.netlify.app/futuretech.html", // Where user goes after paying
                notification_id: ipnId,
                billing_address: {
                    email_address: email || "customer@hatua.store",
                    first_name: name || "Valued Customer",
                    country_code: "KE",
                    phone_number: phone // <--- CRITICAL FOR M-PESA STK
                }
            }));
            req.end();
        });

        // ==================================================
        // FINAL: RETURN THE URL TO FRONTEND
        // ==================================================
        return {
            statusCode: 200,
            body: JSON.stringify({ url: redirectUrl })
        };

    } catch (error) {
        console.error("Payment Error Log:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Internal Server Error" })
        };
    }
};