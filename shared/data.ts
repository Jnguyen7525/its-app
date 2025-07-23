// export type TCard = {
//   id: string;
//   description: string;
// };

import { DropTargetRecord } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";

// export type TColumn = {
//   id: string;
//   title: string;
//   cards: TCard[];
// };
export type TCardField = {
  key: string; // e.g. "name"
  label: string; // e.g. "Name"
  type: "textarea"; // we’ll support more types later
};

export type TCard = {
  id: string;
  values: Record<string, string>; // keyed by field key
  copyMode?: boolean; // ✅ default to false
  createdInColumnId?: string; // 🆕 optional metadata
  createdAt?: number; // Unix timestamp is simple and fast
  mergedCards?: TCard[]; // ⬅️ Track full merged card objects here
};

export type TColumn = {
  id: string;
  title: string;
  fields: TCardField[]; // defines how cards in this column should look
  cards: TCard[];
};

export type TBoard = {
  columns: TColumn[];
};

const cardKey = Symbol("card");
export type TCardData = {
  [cardKey]: true;
  card: TCard;
  columnId: string;
  rect: DOMRect;
};

export function getCardData({
  card,
  rect,
  columnId,
}: Omit<TCardData, typeof cardKey> & { columnId: string }): TCardData {
  return {
    [cardKey]: true,
    rect,
    card,
    columnId,
  };
}

export function isCardData(
  value: Record<string | symbol, unknown>
): value is TCardData {
  return Boolean(value[cardKey]);
}

export function isDraggingACard({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isCardData(source.data);
}

const cardDropTargetKey = Symbol("card-drop-target");
export type TCardDropTargetData = {
  [cardDropTargetKey]: true;
  card: TCard;
  columnId: string;
};

export function isCardDropTargetData(
  value: Record<string | symbol, unknown>
): value is TCardDropTargetData {
  return Boolean(value[cardDropTargetKey]);
}

export function getCardDropTargetData({
  card,
  columnId,
}: Omit<TCardDropTargetData, typeof cardDropTargetKey> & {
  columnId: string;
}): TCardDropTargetData {
  return {
    [cardDropTargetKey]: true,
    card,
    columnId,
  };
}

export function getCardDropTargetDataSafe(
  target: DropTargetRecord | undefined
): TCardDropTargetData | undefined {
  return target && isCardDropTargetData(target.data) ? target.data : undefined;
}

const columnKey = Symbol("column");
export type TColumnData = {
  [columnKey]: true;
  column: TColumn;
};

export function getColumnData({
  column,
}: Omit<TColumnData, typeof columnKey>): TColumnData {
  return {
    [columnKey]: true,
    column,
  };
}

export function getColumnTitleById(
  board: TBoard,
  columnId: string
): string | undefined {
  return board.columns.find((col) => col.id === columnId)?.title;
}

export function isColumnData(
  value: Record<string | symbol, unknown>
): value is TColumnData {
  return Boolean(value[columnKey]);
}

export function isDraggingAColumn({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isColumnData(source.data);
}
