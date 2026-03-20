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

let cherry = PAYTABLE.find(s => s.id === 'cherry');
let step = 0.1;
while (calcRTP(PAYTABLE) > 0.90) {
  cherry.weight += step;
}
console.log('New Cherry Weight:', cherry.weight);
console.log('New Regular RTP:', calcRTP(PAYTABLE));

let TOTAL_WEIGHT = PAYTABLE.reduce((sum, item) => sum + item.weight, 0);
let five = PAYTABLE.find(s => s.id === 'five');
// 1000X minimum prize, so P(five)*1000 = 0.01 (1% RTP for the base 1000X)
// P(five) = 0.00001
// (weight_five / TOTAL_WEIGHT)^3 = 0.00001
// weight_five / TOTAL_WEIGHT = 0.021544
five.weight = 0.021544 * TOTAL_WEIGHT;

console.log('New Five Weight:', five.weight);
console.log('Final PAYTABLE:', JSON.stringify(PAYTABLE, null, 2));
