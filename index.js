import express from 'express';
import bodyParser from'body-parser';
import cors from 'cors';
import './config/db.js';
import allMyRoutes from './allMyRoutes.js';

const app = express();


app.use(bodyParser.json());
app.use(cors());
app.use("/api/v1", allMyRoutes);


app.listen(4000, () => {
  console.log('Server started on port 4000');
});