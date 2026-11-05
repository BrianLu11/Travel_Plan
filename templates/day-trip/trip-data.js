export const trip = {
  tripId:"example-day-trip",
  mark:"旅",
  shortLabel:{"zh-Hant":"東京 / 單日範例",ja:"東京 / サンプル",en:"TOKYO / SAMPLE"},
  title:{"zh-Hant":"東京，留一天散步。",ja:"東京、一日の散歩。",en:"Tokyo, a day to explore."},
  subtitle:{"zh-Hant":"單日行程模板示範。晴雨備案可自由切換。",ja:"日帰りプランのサンプルです。",en:"Sample day trip with sunny and rainy alternatives."},
  features:{ledger:false,gallery:false},
  days:[{id:"2027-05-01",label:{"zh-Hant":"5月1日",ja:"5月1日",en:"May 1"},plans:{
    sunny:{label:{"zh-Hant":"晴天方案",ja:"晴天プラン",en:"Sunny plan"},stops:[{time:"10:00",title:{"zh-Hant":"集合",ja:"集合",en:"Meetup"},description:{"zh-Hant":"示範：東京車站集合。",ja:"例：東京駅で集合。",en:"Sample: meet at Tokyo Station."},map:"Tokyo Station"}]},
    rain:{label:{"zh-Hant":"雨天備案",ja:"雨天プラン",en:"Rainy plan"},stops:[{time:"10:00",title:{"zh-Hant":"室內集合",ja:"屋内で集合",en:"Indoor meetup"},description:{"zh-Hant":"示範：東京車站室內集合。",ja:"例：東京駅構内で集合。",en:"Sample: meet inside Tokyo Station."},map:"Tokyo Station"}]}
  }}]
};
