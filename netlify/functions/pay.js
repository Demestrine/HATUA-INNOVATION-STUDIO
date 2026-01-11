const https = require('https');

exports.handler = async function(event, context) {
    // 1. SECURITY: Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 2. GET INPUT DATA
    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON Data" }) };
    }

    const { amount, email, name, phone } = payload;

    // Validate Input
    if (!amount) return { statusCode: 400, body: JSON.stringify({ error: "Missing Amount" }) };
    if (!phone) return { statusCode: 400, body: JSON.stringify({ error: "Missing Phone Number" }) };

    // 3. SETUP ENVIRONMENT
    // Use 'live' settings if PESAPAL_ENV is set to 'live' in Netlify
    const isLive = process.env.PESAPAL_ENV === 'live';
    const hostname = isLive ? 'pay.pesapal.com' : 'cybqa.pesapal.com';
    const apiPath = isLive ? '/v3/api' : '/pesapalv3/api';

    // Logging for Debugging (Check Netlify Function Logs)
    console.log(`Starting Payment: ${amount} KES for ${phone} on ${hostname}`);

    try {
        // ==================================================
        // STEP A: GET ACCESS TOKEN
        // ==================================================
        const token = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: hostname,
                path: `${apiPath}/Auth/RequestToken`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`Auth Failed (Status ${res.statusCode}): ${data}`));
                    } else {
                        resolve(JSON.parse(data).token);
                    }
                });
            });
            
            req.on('error', (e) => reject(new Error(`Connection Error: ${e.message}`)));
            req.write(JSON.stringify({
                consumer_key: process.env.PESAPAL_CONSUMER_KEY,
                consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
            }));
            req.end();
        });

        // ==================================================
        // STEP B: REGISTER IPN (Instant Payment Notification)
        // ==================================================
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
                url: "https://hatuainnovationstudioke.netlify.app/ipn", // Dummy URL is fine for STK push
                ipn_notification_type: "GET"
            }));
            req.end();
        });

        // ==================================================
        // STEP C: SUBMIT ORDER (Get Payment Link)
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
                    // Check if Pesapal returned an error inside the JSON
                    if (parsed.error) {
                        reject(new Error(`Order Error: ${parsed.error.message}`));
                    } else if (!parsed.redirect_url) {
                        reject(new Error(`Invalid Response: ${data}`));
                    } else {
                        resolve(parsed.redirect_url);
                    }
                });
            });

            const reference = "HATUA-" + Date.now(); 

            // Payload must match Pesapal v3 requirements exactly
            req.write(JSON.stringify({
                id: reference,
                currency: "KES",
                amount: amount,
                description: "Hatua FutureTech Store",
                callback_url: "https://hatuainnovationstudioke.netlify.app/futuretech.html",
                notification_id: ipnId,
                billing_address: {
                    email_address: email || "customer@hatua.tech",
                    first_name: name || "Valued Customer",
                    country_code: "KE",
                    phone_number: phone // Required for M-Pesa STK Push
                }
            }));
            req.end();
        });

        // ==================================================
        // SUCCESS
        // ==================================================
        return {
            statusCode: 200,
            body: JSON.stringify({ url: redirectUrl })
        };

    } catch (error) {
        console.error("Payment Error:", error.message);
        // Return the specific error message to the frontend alert
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};