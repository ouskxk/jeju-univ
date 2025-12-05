// app.js
const STARTING_POKER_CHIPS = 100;
const PLAYERS = 3;
const NO_OF_STARTER_CARDS = 2;
let gameHasEnded = false;

// 선수 이름 설정
let playerOneName = "Chloe";
let playerTwoName = "Jasmine";
let playersThreeName = "Jen";

// 게임 시작 메시지 출력
console.log(`Welcome! 챔피언십 타이틀은 ${playerOneName}, ${playerTwoName}, ${playersThreeName} 중 한 명에게 주어집니다.
  각 선수는 ${STARTING_POKER_CHIPS}의 칩을 가지고 시작합니다. 흥미진진한 경기가 될 것입니다. 최고의 선수가 
  승리하길 바랍니다.`);

// 선수들의 포인트 설정
let playerOnePoints = STARTING_POKER_CHIPS;
let playerTwoPoints = STARTING_POKER_CHIPS;
let playerThreePoints = STARTING_POKER_CHIPS;

// 게임 진행 시뮬레이션 (예시)
playerOnePoints -=50;
playerTwoPoints -=25;
playerThreePoints +=75;

// 게임 종료 조건 확인
gameHasEnded = ((playerOnePoints + playerTwoPoints) == 0) || ((playerTwoPoints + playerThreePoints) ==0 || (playerOnePoints + playerThreePoints) == 0);

//  게임 종료 메시지 출력
console.log("게임이 종료되었습니다 : ", gameHasEnded);


