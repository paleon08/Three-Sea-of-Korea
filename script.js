class ToggleSection {
  static toggle(id, element) {
    const target = document.getElementById(id);
    const isOpen = target.style.display === "block";
    target.style.display = isOpen ? "none" : "block";
    if (element) {
      const text = element.innerText.slice(2);
      element.innerText = (isOpen ? "▶ " : "▼ ") + text;
    }
  }
}

class FeedbackManager {
  constructor(formId, listId) {
    this.form = document.getElementById(formId);
    this.list = document.getElementById(listId);
    this.feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.render();
  }

  render() {
    this.list.innerHTML = '';
    this.feedbacks.forEach(f => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${f.user}</strong>: ${f.text}`;
      this.list.appendChild(div);
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const user = document.getElementById('user').value;
    const text = document.getElementById('comment').value;
    this.feedbacks.push({ user, text });
    localStorage.setItem('feedbacks', JSON.stringify(this.feedbacks));
    this.form.reset();
    this.render();
  }
}

class SeaTemperatureChart {
  constructor() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.date = `${yyyy}${mm}${dd}`;
  }

  async fetchWithFallback(obsCode) {
    let result = await this.fetchData(obsCode, this.date);
    if (result.result?.error === "invalid date") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yyyy = yest.getFullYear();
      const mm = String(yest.getMonth() + 1).padStart(2, '0');
      const dd = String(yest.getDate()).padStart(2, '0');
      const fallbackDate = `${yyyy}${mm}${dd}`;
      result = await this.fetchData(obsCode, fallbackDate);
    }
    return result;
  }

  async fetchData(obsCode, date) {
    const response = await fetch(`http://localhost:3000/api/sea-temp?obsCode=${obsCode}&date=${date}`);
    return await response.json();
  }

  async drawChart(obsCode, canvasId) {
    const result = await this.fetchWithFallback(obsCode);
    const data = result.data;
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

// 초기화
window.addEventListener("DOMContentLoaded", () => {
  new FeedbackManager('feedback-form', 'feedback-list');

  const chart = new SeaTemperatureChart();
  const btn = document.getElementById("east-btn");
  if (btn) {
    btn.addEventListener("click", () => chart.drawChart("TW_0063", "eastTempChart"));
  }
});
