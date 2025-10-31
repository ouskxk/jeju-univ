// 1. HTML 요소 선택하기 (ID 기준으로 정확하게)
const form = document.querySelector('#carbon-form');
const resultsView = document.querySelector('#result-view');
const changeRegionBtn = document.querySelector('#change-region-btn');

// 2. 페이지가 처음 로드될 때,
//    CSS에서 숨겼더라도 JS로 한 번 더 확실하게 결과 창을 숨깁니다.
resultsView.style.display = 'none';

// 3. 'Submit' 버튼 클릭 이벤트 (form이 'submit' 될 때)
form.addEventListener('submit', (e) => {
    // 1. 페이지가 새로고침되는 것을 막습니다. (필수!)
    e.preventDefault(); 
    
    // 2. 폼(#carbon-form)을 숨깁니다.
    form.style.display = 'none';

    // 3. 결과 창(#result-view)을 보여줍니다.
    resultsView.style.display = 'block';
});

// 4. 'Change region' 버튼 클릭 이벤트
changeRegionBtn.addEventListener('click', () => {
    // 1. 결과 창을 다시 숨깁니다.
    resultsView.style.display = 'none';

    // 2. 폼을 다시 보여줍니다.
    form.style.display = 'block';
});