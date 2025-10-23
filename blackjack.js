let cardOne = 7; 
let cardTwo = 5; 
let cardThree = 7; 
let sum = cardOne + cardTwo + cardThree; 

let cardOneBank = 7; 
let cardTwoBank = 5; 
let cardThreeBank = 2; 
let cardFourBank = 5
let bankSum = cardOneBank + cardTwoBank + cardThreeBank + cardFourBank; 

if (sum > 21) {
  console.log('You Bust! Bank wins. ');
}
else if (sum === 21) {
  console.log('Blackjack! You win! ');
}
else if (bankSum > 21) {
  console.log('Bank Busts! You win. ');
}
else if (sum === bankSum) {
  console.log('Draw.');
}
else if (sum > bankSum) {
  console.log('You win! ');
}
else {
  console.log('Bank wins. ');
}