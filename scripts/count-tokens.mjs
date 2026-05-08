// Count tokens using Anthropic's tokenizer
import Anthropic from "@anthropic-ai/sdk";

const text = JSON.stringify({
  "poi": {
    "name": "大江户日本料理(湖滨道店)",
    "address": "湖滨路150号企业天地5号楼湖滨道购物中心L3层E03",
    "type": "餐饮服务;餐饮相关场所;餐饮相关",
    "keytag": "日本料理",
    "tag": "双人餐,寿司,牛肉",
    "tel": "021-53530809;021-54035877;17317615117",
    "rating": "4.6",
    "costPerPerson": "¥254",
    "openingHours": "11:30-13:30；17:30-21:30",
    "businessArea": "淮海路",
    "floor": "L3",
    "floorNumber": "3",
    "hasIndoorMap": true,
    "parentPOI": "B0FFG7KRLT"
  },
  "origin": {
    "name": "兴盛公寓",
    "address": "高邮路1-3号",
    "location": "121.439325,31.210554"
  },
  "metro": {
    "totalDuration": "40 min",
    "fare": "¥3",
    "totalWalkingDistance": "1947m",
    "steps": [
      {
        "type": "walk",
        "duration": "15 min",
        "distance": "1081m",
        "instructions": [
          "步行29米右转",
          "步行25米右转",
          "沿高邮路步行46米右转",
          "沿复兴西路步行159米右转",
          "沿武康路步行274米左转",
          "沿湖南路步行326米左转",
          "沿淮海中路步行141米左转",
          "步行19米",
          "步行62米到达上海图书馆"
        ]
      },
      {
        "type": "metro",
        "line": "地铁10号线(虹桥火车站--基隆路)",
        "lineType": "地铁线路",
        "from": "上海图书馆",
        "fromEntrance": "1号口",
        "to": "一大会址·新天地",
        "toExit": "2号口",
        "stops": 2,
        "viaStops": ["陕西南路"],
        "duration": "12 min",
        "firstTrain": "0547",
        "lastTrain": "2252"
      },
      {
        "type": "walk",
        "duration": "12 min",
        "distance": "866m",
        "instructions": [
          "步行106米左转",
          "步行21米右转",
          "步行44米左转",
          "沿黄陂南路步行212米右转",
          "沿自忠路步行293米左转",
          "沿济南路步行152米右转",
          "步行38米"
        ]
      }
    ]
  },
  "walking": {
    "totalDistance": "4311m",
    "totalDuration": "57 min",
    "steps": [
      { "instruction": "向西步行29米右转", "road": null, "distance": "29m", "duration": "0 min", "direction": "西" },
      { "instruction": "向西北步行25米右转", "road": null, "distance": "25m", "duration": "0 min", "direction": "西北" },
      { "instruction": "沿高邮路向东北步行46米右转", "road": "高邮路", "distance": "46m", "duration": "1 min", "direction": "东北" },
      { "instruction": "沿复兴中路向东步行3056米左转", "road": "复兴中路", "distance": "3056m", "duration": "41 min", "direction": "东" },
      { "instruction": "沿重庆南路向北步行230米右转", "road": "重庆南路", "distance": "230m", "duration": "3 min", "direction": "北" },
      { "instruction": "沿自忠路向东步行735米左转", "road": "自忠路", "distance": "735m", "duration": "10 min", "direction": "东" },
      { "instruction": "沿济南路向北步行152米右转", "road": "济南路", "distance": "152m", "duration": "2 min", "direction": "北" },
      { "instruction": "向东北步行38米到达目的地", "road": null, "distance": "38m", "duration": "1 min", "direction": "东北" }
    ]
  },
  "taxi": {
    "totalDistance": "4408m",
    "totalDuration": "17 min",
    "estimatedFare": "¥17",
    "trafficLights": 23,
    "tolls": "¥0",
    "steps": [
      { "instruction": "向西行驶29米右转", "road": null, "distance": "29m", "duration": "0 min", "trafficLights": 0 },
      { "instruction": "向西北行驶25米右转", "road": null, "distance": "25m", "duration": "0 min", "trafficLights": 0 },
      { "instruction": "沿高邮路向东北行驶46米右转", "road": "高邮路", "distance": "46m", "duration": "0 min", "trafficLights": 1 },
      { "instruction": "沿复兴西路向东行驶804米左转", "road": "复兴西路", "distance": "804m", "duration": "2 min", "trafficLights": 4 },
      { "instruction": "沿淮海中路向东北行驶2.9千米右转", "road": "淮海中路", "distance": "2892m", "duration": "11 min", "trafficLights": 13 },
      { "instruction": "沿黄陂南路向东南行驶182米左转", "road": "黄陂南路", "distance": "182m", "duration": "1 min", "trafficLights": 2 },
      { "instruction": "沿太仓路向东行驶257米右转", "road": "太仓路", "distance": "257m", "duration": "1 min", "trafficLights": 2 },
      { "instruction": "沿济南路向南行驶135米左转", "road": "济南路", "distance": "135m", "duration": "1 min", "trafficLights": 1 },
      { "instruction": "向东北行驶38米到达目的地", "road": null, "distance": "38m", "duration": "0 min", "trafficLights": 0 }
    ]
  }
});

const client = new Anthropic({ apiKey: process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY });
const result = await client.messages.countTokens({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: text }],
});
console.log("Token count:", result.input_tokens);
console.log("Character count:", text.length);
console.log("Chars per token:", (text.length / result.input_tokens).toFixed(1));
