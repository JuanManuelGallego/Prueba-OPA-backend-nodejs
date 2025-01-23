const express = require('express');
const mongoose = require('./db');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const tripSchema = new mongoose.Schema({
  totalCalories: { type: Number, required: true, default: 0 },
  totalWeight: { type: Number, required: true, default: 0 },
  name: { type: String, required: true },
  optimalItems: { type: [String], required: true },
});

const Trip = mongoose.model('Trip', tripSchema);

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/', (req, res) => {
  res.send('Backend for the Prueba OPA project');
});

app.get('/trips', asyncHandler(async (req, res) => {
  const trips = await Trip.find();
  res.json(trips);
}));

app.post('/trips', asyncHandler(async (req, res) => {
  const { name, minCalories, maxWeight, items: elements } = req.body;

  if (isNaN(minCalories) || isNaN(maxWeight)) {
    return res
      .status(400)
      .json({ message: 'Invalid input. Please provide valid numbers.' });
  }

  const result = solveKnapsack(name, parseInt(minCalories), parseInt(maxWeight), elements);
  const trip = new Trip(result);
  const newTrip = await trip.save();
  res.status(201).json(newTrip);
}));

app.delete('/trips/:id', asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  await trip.deleteOne();
  res.json({ message: 'Trip deleted' });
}));

function solveKnapsack(name, minCalories, maxWeight, elements) {
  const n = elements.length;
  const dp = Array.from({ length: n + 1 }, () => Array(maxWeight + 1).fill(0));
  const selectedItems = Array.from({ length: n + 1 }, () => Array(maxWeight + 1).fill(false));

  for (let i = 1; i <= n; i++) {
    const { weight, calories } = elements[i - 1];
    for (let w = 1; w <= maxWeight; w++) {
      if (weight <= w) {
        const withCurrent = dp[i - 1][w - weight] + calories;
        const withoutCurrent = dp[i - 1][w];
        dp[i][w] = Math.max(withCurrent, withoutCurrent);
        selectedItems[i][w] = withCurrent > withoutCurrent;
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const optimalItems = [];
  let w = maxWeight;
  for (let i = n; i > 0 && w > 0; i--) {
    if (selectedItems[i][w]) {
      optimalItems.push(elements[i - 1]);
      w -= elements[i - 1].weight;
    }
  }

  const totalWeight = optimalItems.reduce((sum, item) => sum + item.weight, 0);
  const totalCalories = optimalItems.reduce((sum, item) => sum + item.calories, 0);

  if (totalCalories < minCalories) {
    return { name, optimalItems: [], totalWeight: 0, totalCalories: 0 };
  }

  return {
    name,
    optimalItems: optimalItems.map((item) => item.name),
    totalWeight,
    totalCalories,
  };
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

app.listen(port, () => {
  console.log(`Server running`);
});
