// DOM이 모두 로드되면 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

  // 1. 드래그할 식물(plant)과 드롭할 영역(dropzone)들을 모두 선택합니다.
  const plants = document.querySelectorAll('.plant');
  const dropzones = document.querySelectorAll('.container, #terrarium');

  let draggedPlant = null; // 현재 드래그 중인 식물을 저장할 변수
  let offsetX, offsetY;    // 식물을 클릭한 지점의 오프셋
  let highestZ = 10;       // 식물이 항상 위에 오도록 z-index 관리

  // --- 1. 드래그 시작 (Plant) ---
  plants.forEach(plant => {
    plant.addEventListener('dragstart', (e) => {
      // 드래그 시작!
      draggedPlant = e.target; // 드래그할 식물 저장

      // 1. 드래그할 데이터 설정 (식물의 ID)
      e.dataTransfer.setData('text/plain', e.target.id);
      e.dataTransfer.effectAllowed = 'move';

      // 2. 마우스 커서가 식물의 어디를 잡았는지 계산 (위치 보정용)
      const rect = draggedPlant.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      // 3. 드래그하는 동안 원본 식물은 반투명하게
      setTimeout(() => {
        draggedPlant.style.opacity = '0.5';
      }, 0);
    });

    plant.addEventListener('dragend', (e) => {
      // 드래그 끝!
      // 식물을 놓쳤거나, 드롭에 성공했거나 상관없이 투명도 복구
      if (draggedPlant) {
        draggedPlant.style.opacity = '1';
      }
      draggedPlant = null;
    });
  });

  // --- 2. 드롭 영역 (Dropzone) ---
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      // 4. (필수!) dragover 이벤트에서 preventDefault()를 호출해야 drop 이벤트가 발생합니다.
      e.preventDefault(); 
      
      // 드롭 효과를 'move'로 설정
      e.dataTransfer.dropEffect = 'move';

      // 5. 시각적 피드백: 'hovered' 클래스 추가
      if (zone.id === 'terrarium') {
        zone.querySelector('.jar-walls').classList.add('hovered');
      } else {
        zone.classList.add('hovered');
      }
    });

    zone.addEventListener('dragleave', (e) => {
      // 6. 마우스가 영역을 떠나면 'hovered' 클래스 제거
      if (zone.id === 'terrarium') {
        zone.querySelector('.jar-walls').classList.remove('hovered');
      } else {
        zone.classList.remove('hovered');
      }
    });

    zone.addEventListener('drop', (e) => {
      // 7. (필수!) 드롭 이벤트!
      e.preventDefault();

      // 8. 시각적 피드백 제거
      if (zone.id === 'terrarium') {
        zone.querySelector('.jar-walls').classList.remove('hovered');
      } else {
        zone.classList.remove('hovered');
      }
      
      // 9. 드롭된 식물 가져오기
      const plantId = e.dataTransfer.getData('text/plain');
      const plant = document.getElementById(plantId);

      if (!plant) return;

      // 10. 식물을 드롭한 위치로 이동 (가장 중요!)
      
      // 드롭한 영역(zone)의 좌표
      const zoneRect = zone.getBoundingClientRect();

      // 마우스 위치에서 아까 계산한 오프셋을 빼서 식물의 정확한 좌상단 위치 계산
      // (페이지 좌상단 기준 좌표)
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;

      // 11. 식물의 부모(DOM)를 변경하고 위치를 설정합니다.
      // 사이드바 컨테이너는 position: absolute 이므로, 
      // 해당 컨테이너의 좌상단(zoneRect.left, zoneRect.top)을 빼서 상대 좌표로 변환합니다.
      if (zone.classList.contains('container')) {
        newLeft = e.clientX - zoneRect.left - offsetX;
        newTop = e.clientY - zoneRect.top - offsetY;
        zone.appendChild(plant); // 식물을 해당 컨테이너로 이동
      } else {
        // 유리병(#terrarium)은 position: relative 이므로, 
        // 유리병의 좌상단을 기준으로 상대 좌표를 계산합니다.
        newLeft = e.clientX - zoneRect.left - offsetX;
        newTop = e.clientY - zoneRect.top - offsetY;
        zone.appendChild(plant); // 식물을 유리병(#terrarium)으로 이동
      }

      // 12. 계산된 위치로 식물 스타일 적용
      plant.style.left = `${newLeft}px`;
      plant.style.top = `${newTop}px`;
      plant.style.zIndex = ++highestZ; // 항상 맨 위에 보이도록 z-index 증가
    });
  });
});
