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

function calcRTP(pt: any[]) {
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

// Scale all weights except cherry, wild, scatter, five
let bestFactor = 1.0;
let minDiff = 100;

for (let f = 0.1; f <= 2.0; f += 0.001) {
  let tempPT = JSON.parse(JSON.stringify(PAYTABLE));
  tempPT.forEach((s: any) => {
    if (!['cherry', 'wild', 'scatter', 'five'].includes(s.id)) {
      s.weight *= f;
    }
  });
  let rtp = calcRTP(tempPT);
  if (Math.abs(rtp - 0.90) < minDiff) {
    minDiff = Math.abs(rtp - 0.90);
    bestFactor = f;
  }
}

console.log('Best Factor:', bestFactor);
PAYTABLE.forEach(s => {
  if (!['cherry', 'wild', 'scatter', 'five'].includes(s.id)) {
    s.weight = parseFloat((s.weight * bestFactor).toFixed(2));
  }
});

console.log('New Regular RTP:', calcRTP(PAYTABLE));

let TOTAL_WEIGHT = PAYTABLE.reduce((sum, item) => sum + item.weight, 0);
let five = PAYTABLE.find(s => s.id === 'five');
if (five) {
  five.weight = parseFloat((0.021544 * TOTAL_WEIGHT).toFixed(2));
  console.log('New Five Weight:', five.weight);
}

console.log('Final PAYTABLE:', JSON.stringify(PAYTABLE, null, 2));
