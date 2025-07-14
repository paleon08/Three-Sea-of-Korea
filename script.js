function toggleContent(id, element) {
  const target = document.getElementById(id); // 펼칠 대상 찾기
  const isOpen = target.style.display === "block"; // 현재 펼쳐져 있는지 확인

  // 펼치기/접기
  target.style.display = isOpen ? "none" : "block";

  // 제목 옆의 아이콘 변경 (▶ ↔ ▼)
  if (element) {
    const text = element.innerText.slice(2); // 아이콘 제거한 본문만 남기기
    element.innerText = (isOpen ? "▶ " : "▼ ") + text;
  }
}
const form = document.getElementById('feedback-form');
const list = document.getElementById('feedback-list');
let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');

function render() {
  list.innerHTML = '';
  feedbacks.forEach(f => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${f.user}</strong>: ${f.text}`;
    list.appendChild(div);
  });
}
render();

form.addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('user').value;
  const text = document.getElementById('comment').value;
  feedbacks.push({ user, text });
  localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
  form.reset();
  render();
});


const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const date = `${yyyy}${mm}${dd}`;

// 3개 바다 실시간 fetch
Promise.all([
  fetch(`http://localhost:3000/api/sea-temp?obsCode=TW_0063&date=${date}`), // 동해
  fetch(`http://localhost:3000/api/sea-temp?obsCode=TW_0076&date=${date}`), // 서해
  fetch(`http://localhost:3000/api/sea-temp?obsCode=TW_0062&date=${date}`)  // 남해
])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([east, west, south]) => {
    console.log("동해 수온:", east);
    console.log("서해 수온:", west);
    console.log("남해 수온:", south);
  })
  .catch(error => {
    console.error("실시간 데이터 오류:", error);
  });

async function drawSeaTempChart() {
  // 오늘 날짜 자동 생성
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const date = `${yyyy}${mm}${dd}`;

  // Node.js 서버로 요청 (동해 = TW_0063)
  const response = await fetch(`http://localhost:3000/api/sea-temp?obsCode=TW_0063&date=${date}`);
  const result = await response.json();

  const data = result.data;

  // record_time과 water_temp만 추출
  const labels = data.map(d => d.record_time.slice(11, 16)); // "HH:MM"만 표시
  const temps = data.map(d => parseFloat(d.water_temp));

  // Chart.js 그래프 생성
  new Chart(document.getElementById('eastTempChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '수온 (℃)',
        data: temps,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: '수온 (℃)' }
        },
        x: {
          title: { display: true, text: '시간 (시:분)' }
        }
      }

    }
  });
}


