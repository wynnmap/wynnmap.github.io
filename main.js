document.querySelectorAll('.button').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        const href = btn.getAttribute('href');

        document.querySelector('.site-container').classList.add('exit');
        document.getElementById('vignette').classList.add('exit');
        document.getElementById('map-img').classList.add('exit');

        setTimeout(() => {
            window.location.href = href;
        }, 600);
    });
});


const MAP_WIDTH = 1009;
const MAP_HEIGHT = 1604;

const mapImg = document.getElementById("map-img");

const scale = 0.75;

// This centers the map image in the viewport
const offsetX = (window.innerWidth - (MAP_WIDTH * scale)) / 2;
const offsetY = (window.innerHeight - (MAP_HEIGHT * scale)) / 2;

mapImg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

window.addEventListener('DOMContentLoaded', () => {
    const isReturning = sessionStorage.getItem('returningToHub') === 'true';
    sessionStorage.removeItem('returningToHub');

    if (isReturning) {
        const vignette = document.getElementById('vignette');
        const mapImg = document.getElementById('map-img');
        const siteContainer = document.querySelector('.site-container');

        // Start fully invisible
        vignette.classList.add('entering');
        mapImg.classList.add('entering');
        siteContainer.classList.add('entering');

        // Trigger reflow
        void vignette.offsetWidth;

        // Remove 'entering' after a tick to animate in
        setTimeout(() => {
            vignette.classList.remove('entering');
            mapImg.classList.remove('entering');
            siteContainer.classList.remove('entering');
        }, 20);
    }
});

