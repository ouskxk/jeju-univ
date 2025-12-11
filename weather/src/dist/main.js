// OpenWeatherMap API 키 입력
const API_KEY = "68865119cbdc14e86096e872f3f40ff4"; 
const BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";

// DOM 요소 가져오기
const cityInput = document.getElementById('city-input');
const fetchButton = document.getElementById('fetch-button');
const resultsDiv = document.getElementById('results');

// 핵심 API 요청 및 오류 처리 함수
async function getWeatherForecast(city) {
    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
        resultsDiv.innerHTML = "<p class='error'>API 키(YOUR_API_KEY)를 입력해주세요.</p>";
        return;
    }

    // 쿼리 파라미터 구성: 도시 이름, API 키, 단위를 섭씨(metric)로 설정
    const url = `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        resultsDiv.innerHTML = "<h4>데이터를 불러오는 중... 잠시만 기다려주세요.</h4>";
        const response = await fetch(url);
        
        if (!response.ok) {
            // HTTP 오류 처리
            const errorData = await response.json();
            throw new Error(`요청 실패: ${errorData.message} (코드: ${response.status})`);
        }
        
        const data = await response.json();
        processAndDisplayWeather(data);

    } catch (error) {
        resultsDiv.innerHTML = `<p class='error'>오류 발생: ${error.message}</p>`;
        console.error("API 요청 실패:", error);
    }
}

// 데이터 가공 및 출력 함수
function processAndDisplayWeather(data) {
    const forecastList = data.list;
    const cityName = data.city.name;
    
    // 일별 최고/최저 기온 및 모든 기온 데이터를 저장할 객체
    const dailyData = {};

    // 5일간의 3시간 단위 데이터를 순회하며 일별 통계 계산
    forecastList.forEach(item => {
        const dateTime = new Date(item.dt * 1000);
        // 날짜만 'yyyy. mm. dd' 형식으로 추출
        const date = dateTime.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', year: 'numeric' }); 
        
        const tempMax = item.main.temp_max;
        const tempMin = item.main.temp_min;

        if (!dailyData[date]) {
            // 해당 날짜의 첫 데이터일 경우 초기화
            dailyData[date] = { max: tempMax, min: tempMin, temps: [item.main.temp] };
        } else {
            // 해당 날짜의 최고/최저 온도 업데이트
            dailyData[date].max = Math.max(dailyData[date].max, tempMax);
            dailyData[date].min = Math.min(dailyData[date].min, tempMin);
            dailyData[date].temps.push(item.main.temp);
        }
    });

    // 결과 출력 (DOM 조작)
    let htmlContent = `<h2>${cityName}의 5일간 날씨 동향 분석</h2>`;
    
    for (const date in dailyData) {
        const avgTemp = dailyData[date].temps.reduce((sum, temp) => sum + temp, 0) / dailyData[date].temps.length;
        
        htmlContent += `
            <div class="day-summary">
                <strong>${date}</strong>: 
                최고: ${dailyData[date].max.toFixed(1)}°C / 
                최저: ${dailyData[date].min.toFixed(1)}°C /
                평균: ${avgTemp.toFixed(1)}°C
            </div>
        `;
    }

    resultsDiv.innerHTML = htmlContent;
    
}
fetchButton.addEventListener('click', () => {
    // 입력된 도시 이름의 앞뒤 공백 제거
    const city = cityInput.value.trim(); 
    
    if (city) {
        getWeatherForecast(city);
    } else {
        resultsDiv.innerHTML = "<p class='error'>도시 이름을 입력해주세요.</p>";
    }
});