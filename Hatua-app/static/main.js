/* --- CUSTOM CURSOR LOGIC --- */
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

if (cursorDot && cursorOutline) {
    window.addEventListener('mousemove', (e) => {
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
        cursorOutline.animate({
            left: `${e.clientX}px`,
            top: `${e.clientY}px`
        }, { duration: 500, fill: "forwards" });
    });
}

document.querySelectorAll('.cursor-hover').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
        cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    el.addEventListener('mouseleave', () => {
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorOutline.style.backgroundColor = 'transparent';
    });
});

/* --- 3D BACKGROUND (THREE.JS) --- */
// Only run this if the container exists (to prevent errors on other pages)
const container = document.getElementById('webgl-container');

if (container) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
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
                positions[i * 3] = (Math.random() - 0.5) * 600;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
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

    // Intro Animation
    if (typeof gsap !== 'undefined') {
        gsap.from("h1", { opacity: 0, y: 50, duration: 1.5, delay: 0.5, ease: "power4.out" });
    }
}