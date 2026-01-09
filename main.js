/* =========================================
   1. CUSTOM CURSOR LOGIC
   ========================================= */
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

if (cursorDot && cursorOutline) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Dot follows instantly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows faster (80ms)
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 80, fill: "forwards" });
    });
}

// Hover effects for interactive elements (Updated to handle dynamically loaded links)
// We use 'mouseover' on the document to catch elements added after the page loads
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .cursor-hover')) {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
        cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        cursorOutline.style.borderColor = 'rgba(255, 255, 255, 0)';
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .cursor-hover')) {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorOutline.style.backgroundColor = 'transparent';
        cursorOutline.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    }
});


/* =========================================
   2. 3D BACKGROUND (THREE.JS)
   ========================================= */
const container = document.getElementById('webgl-container');

if (container) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 4000;
    const posArray = new Float32Array(starCount * 3);
    const velocities = [];

    for (let i = 0; i < starCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 600;
        posArray[i + 1] = (Math.random() - 0.5) * 600;
        posArray[i + 2] = (Math.random() - 0.5) * 600;
        velocities.push(0.2 + Math.random() * 0.5);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0x00f3ff,
        size: 0.7,
        transparent: true,
        opacity: 0.8
    }));
    scene.add(stars);

    function animate() {
        const positions = starGeo.attributes.position.array;
        for (let i = 0; i < starCount; i++) {
            positions[i * 3 + 2] += velocities[i];
            if (positions[i * 3 + 2] > 200) {
                positions[i * 3 + 2] = -400;
            }
        }
        starGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    if (typeof gsap !== 'undefined') {
        gsap.from(".hero-text", { opacity: 0, y: 50, duration: 1.5, delay: 0.5, ease: "power4.out" });
        gsap.from(".hero-sub", { opacity: 0, y: 0, duration: 1.5, delay: 0.3, ease: "power4.out" });
    }
}


/* =========================================
   3. COMPONENT LOADER & SERVICES
   ========================================= */

// Data for Services Section (Updated "FutureTech" to Coming Soon)
const services = [
    { 
        link: "marketing.html", 
        icon: "fa-bullhorn", 
        color: "text-[--neon-blue]", 
        title: "Creative Studio", 
        desc: "Marketing & Design.", 
        grad: "from-pink-500/20 to-purple-600/20" 
    },
    { 
        link: "tech.html", 
        icon: "fa-terminal", 
        color: "text-[--neon-purple]", 
        title: "Tech & Dev", 
        desc: "Software & Code.", 
        grad: "from-green-500/20 to-blue-600/20" 
    },
    { 
        link: "#", 
        icon: "fa-microchip", 
        color: "text-gray-500", // Dimmed color
        title: "FutureTech Lab", 
        desc: "COMING SOON", 
        grad: "from-gray-900/40 to-gray-800/40" 
    }
];

// Function to generate the HTML for services
function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return; // Stop if we are not on the homepage
    
    grid.innerHTML = services.map(s => `
        <a href="${s.link}" class="glass-card p-10 rounded-none cursor-hover group block relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br ${s.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="text-5xl ${s.color} mb-6 relative z-10"><i class="fas ${s.icon}"></i></div>
            <h3 class="text-2xl mb-4 relative z-10">${s.title}</h3>
            <p class="text-gray-400 leading-relaxed relative z-10">${s.desc}</p>
        </a>
    `).join('');
}

// Function to load Navbar and Footer
function loadComponent(elementId, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading component:', error));
}

// Initialize everything when the page is ready
document.addEventListener("DOMContentLoaded", function() {
    // 1. Load Navbar
    loadComponent("navbar-placeholder", "navbar.html");
    
    // 2. Load Footer
    loadComponent("footer-placeholder", "footer.html");

    // 3. Render the Services Grid
    renderServices();
});