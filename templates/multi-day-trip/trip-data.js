export const trip = {
  tripId:"example-multi-day",
  mark:"旅",
  shortLabel:{"zh-Hant":"京都 / 旅行範例",ja:"京都 / サンプル",en:"KYOTO / SAMPLE"},
  title:{"zh-Hant":"京都，走過兩日。",ja:"京都、二日間の旅。",en:"Kyoto, two days away."},
  subtitle:{"zh-Hant":"多日行程模板示範。請替換全部日期與行程資料。",ja:"複数日旅程のサンプルです。",en:"Multi-day trip sample. Replace dates and details."},
  features:{ledger:false,gallery:false},
  days:[
    {id:"2027-05-01",label:{"zh-Hant":"Day 1 · 抵達",ja:"1日目 · 到着",en:"Day 1 · Arrival"},plans:{default:{label:{"zh-Hant":"一般行程",ja:"通常プラン",en:"Standard plan"},stops:[{time:"10:00",title:{"zh-Hant":"集合",ja:"集合",en:"Meetup"},description:{"zh-Hant":"示範地點：京都站。",ja:"例：京都駅。",en:"Sample location: Kyoto Station."},map:"Kyoto Station"}]}}},
    {id:"2027-05-02",label:{"zh-Hant":"Day 2 · 漫步",ja:"2日目 · 散策",en:"Day 2 · Walking"},plans:{default:{label:{"zh-Hant":"一般行程",ja:"通常プラン",en:"Standard plan"},stops:[{time:"09:30",title:{"zh-Hant":"早晨散步",ja:"朝の散歩",en:"Morning walk"},description:{"zh-Hant":"請自行確認景點營業時間。",ja:"営業時間を確認してください。",en:"Verify venue hours before travel."},map:"Kyoto Station"}]}}}
  ]
};
