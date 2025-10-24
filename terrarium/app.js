window.onload = function() {
  const plants = document.querySelectorAll('.plant');
  let highestZ = 1; // 가장 높은 z-index 추적용

  plants.forEach(plant => {
    // 위치 이동을 위해 absolute 설정
    plant.style.position = 'absolute';

    let offsetX, offsetY;
    let isDragging = false;

    // 🌱 클릭(혹은 드래그 시작)할 때 항상 제일 위로!
    plant.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - plant.offsetLeft;
      offsetY = e.clientY - plant.offsetTop;

      // 🔼 클릭하면 항상 제일 위로 올라감
      highestZ++;
      plant.style.zIndex = highestZ;

      plant.style.cursor = 'grabbing';
    });

    // 🌱 드래그 중
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      plant.style.left = `${e.clientX - offsetX}px`;
      plant.style.top = `${e.clientY - offsetY}px`;
    });

    // 🌱 드래그 끝
    document.addEventListener('mouseup', () => {
      isDragging = false;
      plant.style.cursor = 'grab';
    });

    // 🌱 더블클릭 시도 시에도 맨 위로 (선택적 — 유지함)
    plant.ondblclick = function() {
      highestZ++;
      plant.style.zIndex = highestZ;
    };
  });
};
