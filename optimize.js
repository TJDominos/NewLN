const LINES = 8;
const targetRTP = 0.90;

let PAYTABLE = [
  { id: 'cherry',     weight: 42,   payout: 1 },
  { id: 'banana',     weight: 22,   payout: 2 },
  { id: 'lemon',      weight: 14,   payout: 5 },
  { id: 'orange',     weight: 10,   payout: 10 },
  { id: 'grape',      weight: 6,    payout: 15 },
  { id: 'strawberry', weight: 3,    payout: 40 },
  { id: 'apple',      weight: 1.5,  payout: 100 },
  { id: 'watermelon', weight: 0.8,  payout: 250 },
  { id: 'star',       weight: 0.5,  payout: 500 },
  { id: 'five',       weight: 0.2,  payout: 1000 },
  { id: 'wild',       weight: 0.3,  payout: 2000 },
  { id: 'scatter',    weight: 0.4,  payout: 0 }
];

function calcRTP(pt) {
  const TOTAL_WEIGHT = pt.reduce((sum, item) => sum + item.weight, 0);
  let totalRTP = 0;
  const wildWeight = pt.find(s => s.id === 'wild').weight;
  const pw = wildWeight / TOTAL_WEIGHT;

  pt.forEach(symbol => {
    if (symbol.id === 'five') return; // exclude jackpot from regular RTP
    if (symbol.id === 'scatter') {
      let probSpin = 0;
      const ps = symbol.weight / TOTAL_WEIGHT;
      for (let k = 3; k <= 9; k++) {
        let nCr = 1;
        for (let i = 1; i <= k; i++) nCr = nCr * (9 - i + 1) / i;
        probSpin += nCr * Math.pow(ps, k) * Math.pow(1 - ps, 9 - k);
      }
      totalRTP += probSpin * 5;
    } else if (symbol.id === 'wild') {
      const probLine = Math.pow(pw, 3);
      totalRTP += probLine * symbol.payout * LINES;
    } else {
      const px = symbol.weight / TOTAL_WEIGHT;
      const probLine = Math.pow(px + pw, 3) - Math.pow(pw, 3);
      totalRTP += probLine * symbol.payout * LINES;
    }
  });
  return totalRTP;
}

let currentRTP = calcRTP(PAYTABLE);
console.log('Current Regular RTP:', currentRTP);

// Let's adjust the weights to hit 90% RTP exactly.
// We can scale the weights of the high-paying symbols or low-paying symbols.
// Let's just scale the lowest paying symbol (cherry) up to lower the RTP.
let cherry = PAYTABLE.find(s => s.id === 'cherry');
let step = 0.1;
while (calcRTP(PAYTABLE) > 0.90) {
  cherry.weight += step;
}
console.log('New Cherry Weight:', cherry.weight);
console.log('New Regular RTP:', calcRTP(PAYTABLE));

// Now for 'five' symbol. The user wants 9% to add to the 1000X minimum prize.
// If the jackpot adds 9% of the bet, then the expected value of the jackpot is funded by this 9%.
// But what about the 1000X minimum?
// If the jackpot resets to 1000X, and grows by 9% of each bet, the average jackpot size when won is 1000X + (9% * expected spins).
// The expected spins is 1 / P(five).
// Average jackpot = 1000 + 0.09 / P(five).
// The RTP of the jackpot is P(five) * Average jackpot = P(five) * 1000 + 0.09.
// But wait, if the RTP of the jackpot is 0.09, then P(five) * 1000 + 0.09 = 0.09, which means P(five) = 0, which is impossible.
// So the 9% must be the TOTAL RTP of the jackpot, meaning P(five) * 1000 + progressive_contribution = 0.09.
// Or maybe the progressive contribution is 9%, and the 1000X base is funded by the regular RTP?
// The user said: "we pay regular prizes for 90% rtp, the rest 9% adds to the 1000X minimun prize of 555."
// This implies the 9% is added to the jackpot, and the regular prizes are 90%.
// Total RTP = 90% + 9% = 99%.
// Wait, what about the 1000X base? If 9% is added, and the base is 1000X, the total RTP is 99% + P(five)*1000.
// If total RTP is 100%, then P(five)*1000 = 1%, so P(five) = 0.00001.
// Let's set P(five) to 0.00001.
// P(five) = (weight_five / TOTAL_WEIGHT)^3 = 0.00001
// weight_five / TOTAL_WEIGHT = 0.02154
// weight_five = 0.02154 * TOTAL_WEIGHT.

let TOTAL_WEIGHT = PAYTABLE.reduce((sum, item) => sum + item.weight, 0);
let five = PAYTABLE.find(s => s.id === 'five');
five.weight = 0.02154 * TOTAL_WEIGHT;

console.log('New Five Weight:', five.weight);
console.log('Final PAYTABLE:', PAYTABLE);
