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
