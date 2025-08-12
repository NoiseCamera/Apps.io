// coloring-select.js
document.addEventListener('DOMContentLoaded', () => {
    // ダブルタップによるズームを防止
    document.body.style.touchAction = 'manipulation';

    const grid = document.getElementById('nurie-grid');

    if (typeof NURIE_IMAGES !== 'undefined' && NURIE_IMAGES.length > 0) {
        NURIE_IMAGES.forEach(image => {
            const link = document.createElement('a');
            link.href = `coloring.html?image=${image.id}`;
            link.classList.add('nurie-link');

            const thumbnail = document.createElement('img');
            thumbnail.src = image.src;
            thumbnail.alt = image.name;
            thumbnail.classList.add('nurie-thumbnail');

            const name = document.createElement('p');
            name.textContent = image.name;

            link.appendChild(thumbnail);
            link.appendChild(name);
            grid.appendChild(link);
        });
    } else {
        grid.innerHTML = '<p>ぬりえがみつかりませんでした。</p>';
    }
});