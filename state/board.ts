import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TBoard, TColumn, TCard } from "@/shared/data";

// Utility to generate initial cards
export function createInitialColumns(): TColumn[] {
  let count = 0;

  const getCards = (amount: number): TCard[] =>
    Array.from({ length: amount }, () => ({
      id: `card:${count++}`,
      description: `Card ${count}`,
    }));

  return [
    { id: "column:a", title: "Column A", cards: getCards(10) },
    { id: "column:b", title: "Column B", cards: getCards(8) },
  ];
}

// Initial board state
const initialState: TBoard = {
  columns: createInitialColumns(),
};
// const initialState: TBoard = {
//   columns: [],
// };

export const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    addColumn: (state, action: PayloadAction<{ title: string }>) => {
      console.log("[Redux] Adding column:", action.payload.title);

      state.columns.push({
        id: `column:${crypto.randomUUID()}`,
        title: action.payload.title,
        cards: [],
      });
    },
    addCard: (
      state,
      action: PayloadAction<{ columnId: string; card: TCard }>
    ) => {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (col) {
        col.cards.push(action.payload.card);
      }
    },
    deleteCard: (
      state,
      action: PayloadAction<{ columnId: string; cardId: string }>
    ) => {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (!col) return;

      col.cards = col.cards.filter((card) => card.id !== action.payload.cardId);
    },
    deleteColumn: (state, action: PayloadAction<{ columnId: string }>) => {
      state.columns = state.columns.filter(
        (col) => col.id !== action.payload.columnId
      );
    },

    deleteAllCardsInColumn: (
      state,
      action: PayloadAction<{ columnId: string }>
    ) => {
      const col = state.columns.find(
        (col) => col.id === action.payload.columnId
      );
      if (col) {
        col.cards = [];
      }
    },
    moveCard: (
      state,
      action: PayloadAction<{
        fromColumnId: string;
        toColumnId: string;
        cardId: string;
        destinationIndex: number;
      }>
    ) => {
      const fromIndex = state.columns.findIndex(
        (c) => c.id === action.payload.fromColumnId
      );
      const toIndex = state.columns.findIndex(
        (c) => c.id === action.payload.toColumnId
      );
      if (fromIndex === -1 || toIndex === -1) return;

      const from = state.columns[fromIndex];
      const to = state.columns[toIndex];

      const cardIndex = from.cards.findIndex(
        (c) => c.id === action.payload.cardId
      );
      if (cardIndex === -1) return;

      // 🔍 Add your log here:
      console.log(
        "[MoveCard] Frozen from.cards:",
        Object.isFrozen(from.cards),
        "| Frozen to.cards:",
        Object.isFrozen(to.cards)
      );

      // Create shallow copies to avoid mutating frozen arrays
      const fromCards = [...from.cards];
      const toCards = [...to.cards];

      const [card] = fromCards.splice(cardIndex, 1);
      toCards.splice(action.payload.destinationIndex, 0, { ...card }); // clone card

      state.columns[fromIndex] = {
        ...from,
        cards: fromCards,
      };
      state.columns[toIndex] = {
        ...to,
        cards: toCards,
      };
    },
    reorderColumns: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const [moved] = state.columns.splice(action.payload.fromIndex, 1);
      state.columns.splice(action.payload.toIndex, 0, moved);
    },
    reorderCardsInColumn: (
      state,
      action: PayloadAction<{
        columnId: string;
        fromIndex: number;
        toIndex: number;
      }>
    ) => {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (!col) return;

      const [moved] = col.cards.splice(action.payload.fromIndex, 1);
      col.cards.splice(action.payload.toIndex, 0, moved);
    },
  },
});

export const {
  addColumn,
  addCard,
  deleteCard,
  deleteColumn,
  deleteAllCardsInColumn,
  moveCard,
  reorderColumns,
  reorderCardsInColumn,
} = boardSlice.actions;

export default boardSlice.reducer;
