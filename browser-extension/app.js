const form = document.querySelector('#carbon-form');
const resultsView = document.querySelector('#result-view');
const changeRegionBtn = document.querySelector('#change-region-btn');

resultsView.style.display = 'none';

form.addEventListener('submit', (e) => {
    e.preventDefault(); 
    form.style.display = 'none';
    resultsView.style.display = 'block';
});

changeRegionBtn.addEventListener('click', () => {
    resultsView.style.display = 'none';
    form.style.display = 'block';
});