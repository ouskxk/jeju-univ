// 아이스크림 가게 매출 및 맛 분석
let iceCreamFlavors = [ 
 { name: "Chocolate", type: "Chocolate", price: 2 }, 
 { name: "Strawberry", type: "Fruit", price: 1 }, 
 { name: "Vanilla", type: "Vanilla", price: 2 }, 
 { name: "Pistachio", type: "Nuts", price: 1.5 }, 
 { name: "Neapolitan", type: "Chocolate", price: 2}, 
 { name: "Mint Chip", type: "Chocolate", price: 1.5 }, 
 { name: "Raspberry", type: "Fruit", price: 1},
];
// 오늘의 거래 내역
let transactions = [];

// 각 거래는 구매한 맛들의 배열과 총액을 포함
transactions.push({ scoops:['Chocolate', 'Vanilla', 'Mint Chip'], total: 5.5});
transactions.push({ scoops:['Raspberry', 'StrawBerry'], total: 2});
transactions.push({ scoops:['Vanilla', 'Vanilla'], total: 4});

// 총 매출 계산
const total = transactions.reduce ((acc, curr) => acc+ curr.total, 0);
console.log(`You've made ${total} $ today!`);

// 맛별 판매 개수 집계
let flavorDistribution = transactions.reduce((acc,curr) => {
  curr.scoops.forEach(scoop => {
    if (!acc[scoop]) {
      acc[scoop]=0;
    }
    acc[scoop]++;
  })
  return acc;
}, {});

console.log(flavorDistribution);


// 가장 많이 팔린 맛 찾기
let mostSoldFlavor = '';
let maxCount = 0;

const flavors = Object.keys(flavorDistribution);
for (const floavor of flavors) {
  if (flavorDistribution[floavor] > maxCount) {
    maxCount = flavorDistribution[floavor];
    mostSoldFlavor = floavor;
  }
}

console.log(`오늘의 1등 맛은 ${mostSoldFlavor} 입니다요`);