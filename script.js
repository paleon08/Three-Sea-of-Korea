const BASE_URL = 'https://three-sea-server.onrender.com';


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
    let response = await fetch(`${BASE_URL}/api/sea-temp?obsCode=${obsCode}&date=${today}`);
    let result = await response.json();

    if (result.result?.error === "invalid date"||
    result.result?.error === "No search data") {
      console.warn(`${obsCode}: 오늘 데이터 없음, 어제 데이터로 대체합니다.`);
      const yest = DateUtil.yesterdayStr();
      response = await fetch(`${BASE_URL}/api/sea-temp?obsCode=${obsCode}&date=${yest}`);
      result = await response.json();
    }

    return result;
  }

  static async drawChart(obsCode, canvasId) {
    console.log("차트 그리기 실행:", obsCode, canvasId);
    const result = await this.fetchWithFallback(obsCode);
    const data = result.result?.data;
    if (!data) {console.error("데이터 없음"); return;}

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

// 🔧 월별 평균 수온 데이터를 불러와 그래프를 그리는 기능 추가
class MonthlyAvgChart {
  static async fetchMonthlyAverage(seaRegion) {
    try {
      const response = await fetch(`${BASE_URL}/api/monthly-average?region=${seaRegion}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("월별 평균 수온 불러오기 실패:", error);
      return null;
    }
  }

  static async drawChart(seaRegion, canvasId) {
    const result = await this.fetchMonthlyAverage(seaRegion);
    if (!result || !result.averages) return;

    const labels = result.averages.map(entry => `${entry.month}월`);
    const temps = result.averages.map(entry => entry.avgTemp);

    new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `${seaRegion} 월별 평균 수온 (℃)`,
          data: temps,
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "평균 수온 (℃)" }
          },
          x: {
            title: { display: true, text: "월" }
          }
        }
      }
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
  const btn = document.getElementById("east-btn");
  console.log("버튼 찾음:", btn);
  if (btn) {
    btn.addEventListener("click", () => {
      console.log("버튼 클릭됨");
      SeaTemperatureChart.drawChart("TW_0080", "eastTempChart");
    });
  } else {"east-btn 못 찾음."}
  const monthlyBtn = document.getElementById("east-monthly-btn");
  if (monthlyBtn) {
    monthlyBtn.addEventListener("click", () => {
      MonthlyAvgChart.drawChart("eastSea", "eastMonthlyChart");
    });
  }
  
  const wbtn = document.getElementById("west-btn");
  console.log("버튼 찾음:", wbtn);
  if (wbtn) {
    wbtn.addEventListener("click", () => {
      console.log("버튼 클릭됨");
      SeaTemperatureChart.drawChart("TW_0076", "westTempChart");
    });
  } else {"east-btn 못 찾음."}
  const monthlywBtn = document.getElementById("west-monthly-btn");
  if (monthlywBtn) {
    monthlywBtn.addEventListener("click", () => {
      MonthlyAvgChart.drawChart("westSea", "westMonthlyChart");
    });
  }
  
  const sbtn = document.getElementById("south-btn");
  console.log("버튼 찾음:", sbtn);
  if (sbtn) {
    sbtn.addEventListener("click", () => {
      console.log("버튼 클릭됨");
      SeaTemperatureChart.drawChart("TW_0062", "southTempChart");
    });
  } else {"east-btn 못 찾음."}
  const monthlysBtn = document.getElementById("south-monthly-btn");
  if (monthlysBtn) {
    monthlysBtn.addEventListener("click", () => {
      MonthlyAvgChart.drawChart("southSea", "southMonthlyChart");
    });
  }

  // 초기 fetch로 콘솔 확인
  const date = DateUtil.todayStr();
  Promise.all([
    SeaTemperatureChart.fetchWithFallback("TW_0080"),//동해 관측소
    SeaTemperatureChart.fetchWithFallback("TW_0076"),//서해 관측소
    SeaTemperatureChart.fetchWithFallback("TW_0062")//남해 관측소
  ])
    .then(([east, west, south]) => {
      console.log("동해 수온:", east);
      console.log("서해 수온:", west);
      console.log("남해 수온:", south);
    })
    .catch(error => console.error("실시간 데이터 오류:", error));
});