// =============================
// HATUA FUTURE TECH | CART SYSTEM
// =============================

let cart = [];

function addToCart(name, price) {
    // Clean price string (remove commas) and convert to number
    const numericPrice = typeof price === 'string' ? parseInt(price.replace(/,/g, '')) : price;
    
    cart.push({ name: name, price: numericPrice });
    updateCartUI();
    toggleCart(true); // Open the panel
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const itemsContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    countEl.innerText = cart.length;

    let total = 0;
    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="text-cyan-900 font-mono text-center mt-20">/// SYSTEM EMPTY /// <br> NO ASSETS SELECTED</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            itemsContainer.innerHTML += `
                <div class="flex justify-between items-center bg-cyan-900/10 border border-cyan-500/20 p-3 mb-2">
                    <div>
                        <div class="text-sm font-bold text-cyan-100 uppercase tracking-wider">${item.name}</div>
                        <div class="text-xs text-cyan-500 font-mono">KES ${item.price.toLocaleString()}</div>
                    </div>
                    <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-400 text-xs tracking-widest">[DEL]</button>
                </div>
            `;
        });
    }

    totalEl.innerText = `KES ${total.toLocaleString()}`;
}

function toggleCart(forceOpen = false) {
    const modal = document.getElementById('cart-modal');
    const panel = document.getElementById('cart-panel');
    
    if (modal.classList.contains('hidden') || forceOpen) {
        modal.classList.remove('hidden');
        setTimeout(() => panel.classList.remove('translate-x-full'), 10);
    } else {
        panel.classList.add('translate-x-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// =============================
// CHECKOUT LOGIC (M-PESA)
// =============================
async function checkout() {
    const phoneInput = document.getElementById('mpesa-phone');
    const btn = document.getElementById('checkout-btn');
    
    // 1. Validation
    if (cart.length === 0) { alert("ERROR: REQUISITION LIST EMPTY"); return; }
    if (!phoneInput.value) { alert("ERROR: MISSING SECURE LINK (PHONE NUMBER)"); phoneInput.focus(); return; }

    // 2. Calculate Total
    let totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    // 3. UI Feedback
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING...';
    btn.disabled = true;

    try {
        // 4. Send to Netlify Backend
        const response = await fetch('/.netlify/functions/pay', {
            method: 'POST',
            body: JSON.stringify({ 
                amount: totalAmount, 
                name: "FutureTech Client", 
                email: "client@hatua.tech", 
                phone: phoneInput.value // Sends the typed number
            })
        });

        const data = await response.json();

        if (data.url) {
            // 5. Success - Redirect to Pesapal
            window.location.href = data.url;
        } else {
            throw new Error("Invalid Response from Server");
        }
    } catch (error) {
        console.error(error);
        alert("TRANSMISSION FAILED: Check connection or try again.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}