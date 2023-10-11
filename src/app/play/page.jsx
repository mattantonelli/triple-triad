"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import DeckSelect from "./deckSelect";
import Deck from "./deck";

const CARD_DATA_URL = "https://triad.raelys.com/api/cards";
const DECK_DATA_URL = "https://triad.raelys.com/api/npcs?deck=1";

export default function Play() {
  const [decks, setDecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [playerDecks, setPlayerDecks] = useState({ blue: [], red: [] });

  function selectDeck(deck, color) {
    let newDecks = {...playerDecks};
    newDecks[color] = deck.split(",").map((id) => cards[id]);
    setPlayerDecks(newDecks);
  }

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

  return (
    <div className="d-flex flex-column align-items-center">
      <div className={styles.board}>
        <DeckSelect decks={decks} selectDeck={selectDeck} />
        <div className={`d-flex justify-content-between ${styles.decks}`}>
          <Deck cards={playerDecks.blue} />
          <Deck cards={playerDecks.red} />
        </div>
      </div>
    </div>
  );
}