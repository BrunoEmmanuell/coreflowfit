
import React from 'react';
import { useParams } from 'react-router-dom';

export default function TreinoDetail(){
  const { id } = useParams();
  return <div className="p-6"><h1 className="text-2xl">Treino {id}</h1></div>;
}
