function showInfo(sea) {
    const info = {
        east:'blank',
        west: 'blank',
        south: 'blank'
    }
    document.getElementById("info-box").innerText = info[sea];

}