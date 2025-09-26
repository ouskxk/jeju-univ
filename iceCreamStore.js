let iceCreamFlavors = [ 
 { name: "Chocolate", type: "Chocolate", price: 2 }, 
 { name: "Strawberry", type: "Fruit", price: 1 }, 
 { name: "Vanilla", type: "Vanilla", price: 2 }, 
 { name: "Pistachio", type: "Nuts", price: 1.5 }, 
 { name: "Neapolitan", type: "Chocolate", price: 2}, 
 { name: "Mint Chip", type: "Chocolate", price: 1.5 }, 
 { name: "Raspberry", type: "Fruit", price: 1},
];

let transactions = [];

transactions.push({ scoops:['Chocolate', 'Vanilla', 'Mint Chip'], total: 5.5});
transactions.push({ scoops:['Raspberry', 'StrawBerry'], total: 2});
transactions.push({ scoops:['Vanilla', 'Vanilla'], total: 4});

const total = transactions.reduce ((acc, curr) => acc+ curr.total, 0);
console.log(`You've made ${total} $ today!`);

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