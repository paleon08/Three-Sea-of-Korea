// 날짜 유틸
class DateUtil {
  static todayStr() {
    const today = new Date();
    return this.format(today);
  }

  static yesterdayStr() {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return this.format(yest);
  }

  static format(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }
}

// 수온 API + 차트 그리기
class SeaTemperatureChart {
  static async fetchWithFallback(obsCode) {
    const today = DateUtil.todayStr();
    let response = await fetch(`http://localhost:3000/api/sea-temp?obsCode=${obsCode}&date=${today}`);
    let result = await response.json();

    if (result.result?.error === "invalid date") {
      const yest = DateUtil.yesterdayStr();
      response = await fetch(`http://localhost:3000/api/sea-temp?obsCode=${obsCode}&date=${yest}`);
      result = await response.json();
    }

    return result;
  }

  static async drawChart(obsCode, canvasId) {
    const result = await this.fetchWithFallback(obsCode);
    const data = result.data;
    if (!data) return;

    const labels = data.map(d => d.record_time.slice(11, 16));
    const temps = data.map(d => parseFloat(d.water_temp));
    const min = Math.floor(Math.min(...temps) - 1);
    const max = Math.ceil(Math.max(...temps) + 1);

    new Chart(document.getElementById(canvasId), {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "수온 (℃)",
          data: temps,
          borderColor: "blue",
          backgroundColor: "rgba(0, 0, 255, 0.1)",
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: min,
            max: max,
            title: { display: true, text: "수온 (℃)" }
          },
          x: {
            title: { display: true, text: "시간 (시:분)" }
          }
        }
      }
    });
  }
}

// 피드백 관리
class FeedbackManager {
  constructor(formId, listId) {
    this.form = document.getElementById(formId);
    this.list = document.getElementById(listId);
    this.feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', e => {
        e.preventDefault();
        const user = this.form.querySelector('#user').value;
        const text = this.form.querySelector('#comment').value;
        this.feedbacks.push({ user, text });
        localStorage.setItem('feedbacks', JSON.stringify(this.feedbacks));
        this.form.reset();
        this.render();
      });
    }
    this.render();
  }

  render() {
    if (!this.list) return;
    this.list.innerHTML = '';
    this.feedbacks.forEach(f => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${f.user}</strong>: ${f.text}`;
      this.list.appendChild(div);
    });
  }
}

// 토글 기능
class ToggleController {
  static bindToggles() {
    const headers = document.querySelectorAll(".clickable.outlined");
    headers.forEach(header => {
      const targetId = header.dataset.target;
      if (!targetId) return;

      header.addEventListener("click", () => {
        const target = document.getElementById(targetId);
        if (!target) return;
        const isOpen = target.style.display === "block";
        target.style.display = isOpen ? "none" : "block";

        // 아이콘 변경
        const text = header.innerText.slice(2); // 아이콘 제거
        header.innerText = (isOpen ? "▶ " : "▼ ") + text;
      });
    });
  }
}

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 피드백 처리 (필요할 때만 실행됨)
  new FeedbackManager('feedback-form', 'feedback-list');

  // 토글 바인딩
  ToggleController.bindToggles();

  // 수온 summary 클릭 → 그래프 그리기
  const summary = document.getElementById("east-summary");
  if (summary) {
    summary.addEventListener("click", () => {
      SeaTemperatureChart.drawChart("TW_0063", "eastTempChart");
    });
  }

  // 초기 fetch로 콘솔 확인
  const date = DateUtil.todayStr();
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
    .catch(error => console.error("실시간 데이터 오류:", error));
});
