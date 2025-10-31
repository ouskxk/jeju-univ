document.addEventListener('DOMContentLoaded', () => {
  const plants = document.querySelectorAll('.plant');
  const dropzones = document.querySelectorAll('.container, #terrarium');

  let draggedPlant = null; 
  let offsetX, offsetY;    
  let highestZ = 10;       

  plants.forEach(plant => {
    plant.addEventListener('dragstart', (e) => {
      
      draggedPlant = e.target; 
      
      e.dataTransfer.setData('text/plain', e.target.id);
      e.dataTransfer.effectAllowed = 'move';

      const rect = draggedPlant.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      
      setTimeout(() => {
        draggedPlant.style.opacity = '0.5';
      }, 0);
    });

    plant.addEventListener('dragend', (e) => {
      if (draggedPlant) {
        draggedPlant.style.opacity = '1';
      }
      draggedPlant = null;
    });
  });

  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault(); 

      e.dataTransfer.dropEffect = 'move';

      if (zone.id === 'terrarium') {
        zone.querySelector('.jar-walls').classList.add('hovered');
      } else {
        zone.classList.add('hovered');
      }
    });

    zone.addEventListener('dragleave', (e) => {
      if (zone.id === 'terrarium') {
        zone.querySelector('.jar-walls').classList.remove('hovered');
      } else {
        zone.classList.remove('hovered');
      }
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();

      if (zone.id === 'terrarium') {
        zone.querySelector('.jar-walls').classList.remove('hovered');
      } else {
        zone.classList.remove('hovered');
      }
      
      const plantId = e.dataTransfer.getData('text/plain');
      const plant = document.getElementById(plantId);

      if (!plant) return;
      const zoneRect = zone.getBoundingClientRect();
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;

      if (zone.classList.contains('container')) {
        newLeft = e.clientX - zoneRect.left - offsetX;
        newTop = e.clientY - zoneRect.top - offsetY;
        zone.appendChild(plant); /
      } else {
        newLeft = e.clientX - zoneRect.left - offsetX;
        newTop = e.clientY - zoneRect.top - offsetY;
        zone.appendChild(plant); 
      }
      
      plant.style.left = `${newLeft}px`;
      plant.style.top = `${newTop}px`;
      plant.style.zIndex = ++highestZ;
    });
  });
});
