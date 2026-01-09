// 1. Load the Google Analytics library dynamically
var script = document.createElement('script');
script.src = "https://www.googletagmanager.com/gtag/js?id=G-EEJ9D0B1RX";
script.async = true;
document.head.appendChild(script);

// 2. Initialize the dataLayer
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// 3. Configure your specific ID
gtag('config', 'G-EEJ9D0B1RX');