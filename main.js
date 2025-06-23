document.querySelectorAll('.button').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        const href = btn.getAttribute('href');

        document.querySelector('.site-container').classList.add('exit');
        document.getElementById('vignette').classList.add('exit');
        document.getElementById('map-img').classList.add('exit');
        document.getElementById('credits-button').classList.add('exit');

        setTimeout(() => {
            window.location.href = href;
        }, 800);
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

const creditsButton = document.getElementById('credits-button');
const creditsPopup = document.getElementById('credits-popup');
const creditsVignette = document.getElementById('credits-vignette');
const popupClose = document.getElementById('popup-close');

function openPopup() {
  creditsVignette.style.display = 'block';
  creditsPopup.style.display = 'block';

  creditsVignette.classList.remove('closing');
  creditsPopup.classList.remove('closing');

  creditsVignette.classList.add('active');
  creditsPopup.classList.add('active');
}

function closePopup() {
  creditsVignette.classList.remove('active');
  creditsPopup.classList.remove('active');

  creditsVignette.classList.add('closing');
  creditsPopup.classList.add('closing');

  // Wait for animation to end, then hide
  const onAnimationEnd = (e) => {
    if (e.target === e.currentTarget) {
      creditsPopup.style.display = 'none';
      creditsVignette.style.display = 'none';
      creditsVignette.removeEventListener('animationend', onAnimationEnd);
    }
  };
  creditsVignette.addEventListener('animationend', onAnimationEnd);
}

creditsButton.addEventListener('click', openPopup);
popupClose.addEventListener('click', closePopup);
creditsVignette.addEventListener('click', closePopup);


