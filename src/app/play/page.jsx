"use client";

import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "./styles.module.scss";
import Player from "./player";
import Board from "./board";

const CARD_DATA_URL = "https://triad.raelys.com/api/cards";
const DECK_DATA_URL = "https://triad.raelys.com/api/npcs?deck=1";

export default function Play() {
  const [decks, setDecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [playedCards, setPlayedCards] = useState({ blue: [], red: [] });

  useEffect(() => {
    function getCards() {
      fetch(CARD_DATA_URL, { next: { revalidate: 86400 }})
      .then((res) => res.json())
      .then((data) => {
        let cardsById = {};

        for(const card of data.results) {
          cardsById[card.id] = card;
        }

        setCards(cardsById);
      });
    }

    function getDecks() {
      let npcDecks = [];

      fetch(DECK_DATA_URL, { next: { revalidate: 86400 }})
      .then((res) => res.json())
      .then((data) => data.results.sort((a, b) => a.name < b.name ? -1 : 0)) // Sort alphabetically
      .then((npcs) => {
        for(const npc of npcs) {
          // Initialize the deck with the list of fixed cards
          let deck = npc.fixed_cards;

          // Add random variable cards to the deck until it is full
          while (deck.length < 5) {
            deck = [
              ...deck,
              ...npc.variable_cards.splice(Math.floor(Math.random * npc.variable_cards.length), 1)
            ];
          }

          // Condense the decks into a list of card IDs so we can easily pass them around
          npcDecks.push({ name: npc.name, cards: deck.map((card) => card.id).join(",") });
        }

        setDecks(npcDecks);
      });
    }

    getCards();
    getDecks();
    }, []);

    function playCard(card, color) {
      let newCards = {...playedCards};
      newCards[color].push(card);
      setPlayedCards(newCards);
    }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`d-flex ${styles.gameMat} mx-auto`}>
        <Player allCards={cards} playedCards={playedCards.blue} decks={decks} color="blue" />
        <Board playCard={playCard} />
        <Player allCards={cards} playedCards={playedCards.red} decks={decks} color="red" />
      </div>
    </DndProvider>
  );
}