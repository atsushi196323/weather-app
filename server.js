import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
const KINKI_CITIES = ["Osaka", "Kyoto", "Hyogo", "Nara", "Wakayama", "Shiga"]; // 近畿地方の都市

// WebSocketサーバー
const wss = new WebSocketServer({ port: 8080 });

// CORSミドルウェアを使用
app.use(cors());
app.use(express.static("public")); // フロントエンドファイルを提供

// 天気情報を取得するエンドポイント
app.get("/weather", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).send("都市名を入力してください");
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.cod !== 200) throw new Error(data.message); // OpenWeatherMap APIのエラーメッセージ
    res.json(data);
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    res.status(500).send(error.message);
  }
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocketの接続処理
wss.on("connection", (ws) => {
  console.log("クライアントが接続されました");

  // 天気データを取得してWebSocketクライアントに送信
  const sendWeatherData = async () => {
    try {
      const promises = KINKI_CITIES.map(async (city) => {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.cod !== 200) throw new Error(data.message);
        return {
          city: data.name,
          condition: data.weather[0].description,
          temperature: `${data.main.temp}°C`,
        };
      });

      const weatherData = await Promise.all(promises);
      ws.send(JSON.stringify(weatherData)); // クライアントに天気データを送信
    } catch (error) {
      console.error("Error fetching weather data:", error.message);
    }
  };

  // 10秒ごとに天気データを送信
  const intervalId = setInterval(sendWeatherData, 10000);

  // クライアントが切断した場合にインターバルを停止
  ws.on("close", () => {
    clearInterval(intervalId);
    console.log("クライアントが切断されました");
  });
});
