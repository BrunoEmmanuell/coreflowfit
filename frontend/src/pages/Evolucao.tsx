
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const sample = [
  { date: '2025-01-01', peso: 80 },
  { date: '2025-02-01', peso: 78 },
  { date: '2025-03-01', peso: 77 },
];

export default function Evolucao(){
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Evolução</h1>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={sample}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="peso" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
