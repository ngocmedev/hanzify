import React from 'react';
import DeckCard from './DeckCard';

interface Deck {
  id: string;
  level: string;
  description: string;
  count: number;
}

interface DeckListProps {
  decks: Deck[];
}

export default function DeckList({ decks }: DeckListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}
