const apiUrl = "http://localhost:3000/weather";
const ws = new WebSocket("ws://localhost:8080");

document.getElementById("searchButton").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;
  if (city) {
    fetchWeather(city);
  } else {
    alert("都市名を入力してください");
  }
});

async function fetchWeather(city) {
  if (!city.trim()) {
    alert("都市名を入力してください");
    return;
  }

  try {
    console.log("Fetching weather data for:", city); // デバッグ用
    const response = await fetch(`${apiUrl}?city=${city}`);
    if (!response.ok) throw new Error("都市が見つかりませんでした");
    const data = await response.json();

    displayWeather(data);
  } catch (error) {
    alert(error.message);
  }
}

function displayWeather(data) {
  const weatherList = document.getElementById("weatherList");
  const listItem = document.createElement("li");
  listItem.innerHTML = `<strong>${data.name}</strong>: ${data.weather[0].description}, ${data.main.temp}°C`;
  weatherList.appendChild(listItem);
}

ws.onopen = () => {
  console.log("WebSocketに接続しました");
};

ws.onmessage = (event) => {
  const weatherData = JSON.parse(event.data);
  const weatherList = document.getElementById("weatherList");
  weatherList.innerHTML = ""; // リアルタイム更新でクリア

  weatherData.forEach((data) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<strong>${data.city}</strong>: ${data.condition}, ${data.temperature}`;
    weatherList.appendChild(listItem);
  });
};

ws.onclose = () => {
  console.log("WebSocketが閉じられました");
  alert("WebSocket接続が閉じられました。");
};

ws.onerror = (error) => {
  console.error("WebSocketエラー: ", error);
  alert(
    "WebSocket接続に問題があります。サーバーが起動しているか確認してください。"
  );
};
