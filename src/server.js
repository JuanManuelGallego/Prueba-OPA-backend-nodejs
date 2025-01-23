const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db');
const app = express();
const port = 3000;

app.use(bodyParser.json());


const tripSchema = new mongoose.Schema({
  totalCalories: Number,
  totalWeight: Number,
  name: String,
  optimalItems: [String],  
});

const Trip = mongoose.model('Trip', tripSchema);
app.get('/', async (req, res) => {
  res.send("Backend for the Prueba OPA project")
})

app.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/trips', async (req, res) => {
  const name = req.body.name;
  const minCalories = parseInt(req.body.minCalories);
  const maxWeight = parseInt(req.body.maxWeight);
  const elements = req.body.items;

  if (isNaN(minCalories) || isNaN(maxWeight)) {
    return res.status(400).json({ message: 'Invalid input. Please provide numbers for minCalories and maxWeight.' });
  }

  const result = solveKnapsack(name, minCalories, maxWeight, elements);

  const trip = new Trip(result);
  try {
    const newTrip = await trip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    await trip.deleteOne();
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

function solveKnapsack(name, minCalories, maxWeight, elements) {
  const dp = Array(elements.length + 1)
    .fill(null)
    .map(() => Array(maxWeight + 1).fill(0));
  const selectedItems = Array(elements.length + 1)
    .fill(null)
    .map(() => Array(maxWeight + 1).fill(false));

  // Build DP table
  for (let i = 1; i <= elements.length; i++) {
    for (let w = 1; w <= maxWeight; w++) {
      const { weight, calories } = elements[i - 1];
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

  // Trace back to find optimal items
  const optimalItems = [];
  let w = maxWeight;

  for (let i = elements.length; i > 0 && w > 0; i--) {
    if (selectedItems[i][w]) {
      optimalItems.push(elements[i - 1]);
      w -= elements[i - 1].weight;
    }
  }

  // Calculate total weight and calories of the selected items
  const totalWeight = optimalItems.reduce((sum, item) => sum + Number(item.weight), 0);
  const totalCalories = optimalItems.reduce((sum, item) => sum + Number(item.calories), 0);  

  // Check if the selected items meet the minCalories requirement
  if (totalCalories < minCalories) {
    return {
      name,
      optimalItems: [],
      totalWeight: 0,
      totalCalories: 0,
    };
  }

  // Return the result if it meets the requirements
  return {
    name,
    optimalItems: optimalItems.map(item => item.name),
    totalWeight,
    totalCalories,
  };
}
