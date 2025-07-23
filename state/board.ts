import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TBoard, TColumn, TCard, TCardField } from "@/shared/data";

// Utility to generate initial cards
// export function createInitialColumns(): TColumn[] {
//   let count = 0;

//   const getCards = (amount: number): TCard[] =>
//     Array.from({ length: amount }, () => ({
//       id: `card:${count++}`,
//       description: `Card ${count}`,
//     }));

//   return [
//     { id: "column:a", title: "Column A", cards: getCards(10) },
//     { id: "column:b", title: "Column B", cards: getCards(8) },
//   ];
// }

// // Initial board state
// const initialState: TBoard = {
//   columns: createInitialColumns(),
// };
const initialState: TBoard = {
  columns: [],
};

export const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    addColumn: (state, action: PayloadAction<{ title: string }>) => {
      state.columns.push({
        id: `column:${crypto.randomUUID()}`,
        title: action.payload.title,
        fields: [], // ⬅️ start empty
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
      // check if copyMode is on don't move the card
      const sourceCol = state.columns.find(
        (c) => c.id === action.payload.fromColumnId
      );
      const cardCopy = sourceCol?.cards.find(
        (c) => c.id === action.payload.cardId
      );
      if (cardCopy?.copyMode) {
        console.log("[MoveCard] Skipping move — copy mode is enabled");
        return;
      }

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
    updateCardValue: (
      state,
      action: PayloadAction<{
        columnId: string;
        cardId: string;
        fieldKey: string;
        value: string;
      }>
    ) => {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (!col) return;

      const card = col.cards.find((c) => c.id === action.payload.cardId);
      if (!card) return;

      card.values[action.payload.fieldKey] = action.payload.value;
    },

    // mergeCardIntoCard: (
    //   state,
    //   action: PayloadAction<{
    //     sourceColumnId: string;
    //     sourceCardId: string;
    //     targetColumnId: string;
    //     targetCardId: string;
    //     preserveSource?: boolean;
    //   }>
    // ) => {
    //   const sourceCol = state.columns.find(
    //     (c) => c.id === action.payload.sourceColumnId
    //   );
    //   const targetCol = state.columns.find(
    //     (c) => c.id === action.payload.targetColumnId
    //   );
    //   if (!sourceCol || !targetCol) return;

    //   const source = sourceCol.cards.find(
    //     (c) => c.id === action.payload.sourceCardId
    //   );
    //   const target = targetCol.cards.find(
    //     (c) => c.id === action.payload.targetCardId
    //   );
    //   if (!source || !target) return;

    //   // ✅ Deep clone source card's original values before mutating anything
    //   const sourceValuesSnapshot: Record<string, string> = JSON.parse(
    //     JSON.stringify(source.values)
    //   );

    //   // ✅ Merge into target using frozen snapshot
    //   Object.entries(sourceValuesSnapshot).forEach(([key, value]) => {
    //     if (!target.values[key]) {
    //       target.values[key] = value;
    //     }
    //   });

    //   // ✅ Remove original only if copy mode is OFF
    //   if (!action.payload.preserveSource) {
    //     sourceCol.cards = sourceCol.cards.filter((c) => c.id !== source.id);
    //   }
    // },
    mergeCardIntoCard: (
      state,
      action: PayloadAction<{
        sourceColumnId: string;
        sourceCardId: string;
        targetColumnId: string;
        targetCardId: string;
        preserveSource: boolean;
      }>
    ) => {
      const targetCol = state.columns.find(
        (c) => c.id === action.payload.targetColumnId
      );
      const targetCard = targetCol?.cards.find(
        (c) => c.id === action.payload.targetCardId
      );

      const sourceCol = state.columns.find(
        (c) => c.id === action.payload.sourceColumnId
      );
      const sourceCard = sourceCol?.cards.find(
        (c) => c.id === action.payload.sourceCardId
      );

      if (!sourceCard || !targetCard) return;

      // ✅ Initialize if needed
      if (!targetCard.mergedCards) {
        targetCard.mergedCards = [];
      }

      // ✅ Push source card into mergedCards, skip if already exists
      const alreadyMerged = targetCard.mergedCards.some(
        (c) => c.id === sourceCard.id
      );
      if (!alreadyMerged) {
        targetCard.mergedCards.push({ ...sourceCard });
      }

      // ✅ Optionally merge values if they don’t duplicate existing ones
      // Object.entries(sourceCard.values).forEach(([key, value]) => {
      //   if (!targetCard.values[key]) {
      //     targetCard.values[key] = value;
      //   }
      // });

      // ✅ Optionally delete sourceCard from original column
      if (!action.payload.preserveSource && sourceCol) {
        sourceCol.cards = sourceCol.cards.filter((c) => c.id !== sourceCard.id);
      }
    },
    toggleCopyMode: (
      state,
      action: PayloadAction<{ columnId: string; cardId: string }>
    ) => {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (!col) return;
      const card = col.cards.find((c) => c.id === action.payload.cardId);
      if (!card) return;
      card.copyMode = !card.copyMode;
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
  updateCardValue,
  mergeCardIntoCard,
  toggleCopyMode,
} = boardSlice.actions;

export default boardSlice.reducer;
