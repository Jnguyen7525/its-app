"use client";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import invariant from "tiny-invariant";

import { isSafari } from "@/shared/is-safari";
import {
  type Edge,
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  getCardData,
  getCardDropTargetData,
  getCardDropTargetDataSafe,
  isCardData,
  isCardDropTargetData,
  isDraggingACard,
  isDraggingAMergedCard,
  isMergedCardData,
  TCard,
  TColumn,
} from "./data";
import { isShallowEqual } from "./is-shallow-equal";

import { useAppDispatch } from "@/state/redux";
import {
  addCard,
  clearMergedCards,
  deleteCard,
  removeMergedCard,
  reorderCardsInColumn,
  reorderMergedCards,
  toggleCopyMode,
  updateCardValue,
} from "@/state/board";
import { Copy, Trash2 } from "lucide-react";

import { mergeCardIntoCard } from "@/state/board";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type TCardState =
  | {
      type: "idle";
    }
  | {
      type: "is-dragging";
    }
  | {
      type: "is-dragging-and-left-self";
    }
  | {
      type: "is-over";
      dragging: DOMRect;
      closestEdge: Edge;
    }
  | {
      type: "preview";
      container: HTMLElement;
      dragging: DOMRect;
    };

const idle: TCardState = { type: "idle" };

// const innerStyles: { [Key in TCardState["type"]]?: string } = {
//   idle: "hover:outline-solid hover:outline-1 outline-neutral-50 cursor-grab",
//   "is-dragging": "opacity-40",
// };
const innerStyles: { [Key in TCardState["type"]]?: string } = {
  idle: "hover:outline-solid hover:outline-1 outline-purple-500",
  "is-dragging": "opacity-40",
};

const outerStyles: { [Key in TCardState["type"]]?: string } = {
  // We no longer render the draggable item after we have left it
  // as it's space will be taken up by a shadow on adjacent items.
  // Using `display:none` rather than returning `null` so we can always
  // return refs from this component.
  // Keeping the refs allows us to continue to receive events during the drag.
  "is-dragging-and-left-self": "hidden",
};

export function CardShadow({ dragging }: { dragging: DOMRect }) {
  return (
    <div
      className="shrink-0 rounded bg-slate-900"
      style={{ height: dragging.height }}
    />
  );
}

export function CardDisplay({
  card,
  column,
  state,
  outerRef,
  innerRef,
  dragHandleRef,
}: {
  card: TCard;
  column: TColumn;
  state: TCardState;
  outerRef?: React.MutableRefObject<HTMLDivElement | null>;
  innerRef?: MutableRefObject<HTMLDivElement | null>;
  dragHandleRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  const dispatch = useAppDispatch();

  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [isDragBarHovered, setIsDragBarHovered] = useState(false);

  const defaultKeys = column.fields.map((f) => f.key);
  const allKeys = Object.keys(card.values); // no assumptions
  const customKeys = allKeys.filter((key) => !defaultKeys.includes(key));

  const mergeDropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (card.createdInColumnId && card.createdInColumnId !== column.id) {
      console.log(
        `[CardDisplay] Card ${card.id} was originally created in column: ${card.createdInColumnId}`
      );
    }
  }, [card, column.id]);

  useEffect(() => {
    // if (!mergeDropRef.current) return;
    if (!innerRef || !innerRef.current) return;

    return dropTargetForElements({
      // element: mergeDropRef.current,
      element: innerRef.current,
      getIsSticky: () => true,
      // canDrop: isDraggingACard,
      canDrop({ source }) {
        if (!isCardData(source.data)) return false;

        const sourceCard = source.data.card;
        const sourceColId = source.data.columnId;
        const targetColId = column.id;

        const isMergeAllowed =
          sourceCard.copyMode && sourceColId !== targetColId;
        const isReorderAllowed = !sourceCard.copyMode;

        return isMergeAllowed || isReorderAllowed;
      },
      getData: () => getCardDropTargetData({ card, columnId: column.id }),
      // onDrop({ source }) {
      //   if (!isCardData(source.data)) return;
      //   if (source.data.card.id === card.id) return;

      //   dispatch(
      //     mergeCardIntoCard({
      //       sourceColumnId: source.data.columnId,
      //       sourceCardId: source.data.card.id,
      //       targetColumnId: column.id,
      //       targetCardId: card.id,
      //       preserveSource: source.data.card.copyMode ?? false,
      //     })
      //   );
      // },
      onDrop({ source }) {
        if (!isCardData(source.data)) return;

        const sourceCard = source.data.card;
        const sourceColId = source.data.columnId;
        const targetColId = column.id;
        const isSameCard = sourceCard.id === card.id;
        const isSameColumn = sourceColId === targetColId;

        if (isSameCard) return;

        if (sourceCard.copyMode) {
          if (!isSameColumn) {
            // ✅ Merge across columns only
            dispatch(
              mergeCardIntoCard({
                sourceColumnId: sourceColId,
                sourceCardId: sourceCard.id,
                targetColumnId: targetColId,
                targetCardId: card.id,
                preserveSource: true,
              })
            );
          } else {
            // ⛔️ Don't merge within the same column
            console.log(
              `[CardDisplay] Skip merge: cannot merge within same column`
            );
          }
        } else {
          // ✅ Reorder in any column
          const columnCards = column.cards;
          const fromIndex = columnCards.findIndex(
            (c) => c.id === sourceCard.id
          );
          const toIndex = columnCards.findIndex((c) => c.id === card.id);

          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            const before = true; // optional: add closestEdge logic if needed
            const targetIndex = before ? toIndex : toIndex + 1;

            dispatch(
              reorderCardsInColumn({
                columnId: targetColId,
                fromIndex,
                toIndex:
                  targetIndex > fromIndex ? targetIndex - 1 : targetIndex,
              })
            );
          }
        }
      },
    });
  }, [card, column, dispatch]);

  return (
    <div
      ref={outerRef}
      className={`cursor-default rounded-md flex border border-zinc-900 bg-zinc-950 shrink-0 flex-col gap-1 px-2 py-1 ${outerStyles[state.type]} `}
    >
      {state.type === "is-over" && state.closestEdge === "top" && (
        <CardShadow dragging={state.dragging} />
      )}
      <div
        ref={dragHandleRef}
        // className="cursor-grab bg-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-zinc-700 transition-colors flex w-full items-center justify-center"
        className="cursor-grab group text-zinc-600 text-xs font-semibold  rounded-md flex w-full items-center justify-center my-1"
        onMouseEnter={() => setIsDragBarHovered(true)}
        onMouseLeave={() => setIsDragBarHovered(false)}
      >
        {/* Left bar */}
        <div className="h-1 rounded-full bg-blue-500 flex-[1] group-hover:bg-purple-500" />

        {/* Text */}
        <p className="text-center mx-2 w-fit text-blue-500 group-hover:text-purple-500">
          Drag to move card
        </p>

        {/* Right bar */}
        <div className="h-1 rounded-full bg-blue-500 flex-[1] group-hover:bg-purple-500" />
      </div>
      <div
        ref={innerRef}
        // className={`relative rounded text-slate-300 ${innerStyles[state.type]}`}
        className={`relative rounded text-slate-300 p-1 ${
          isDragBarHovered ? `${innerStyles[state.type]} outline-1` : ""
        }`}
        style={
          state.type === "preview"
            ? {
                width: state.dragging.width,
                height: state.dragging.height,
                transform: !isSafari() ? "rotate(4deg)" : undefined,
              }
            : undefined
        }
      >
        <div className=" flex w-full justify-between">
          <div className="flex items-center text-xs">
            <button
              id={`copy-card-${card.id}`}
              onClick={() =>
                dispatch(
                  toggleCopyMode({ columnId: column.id, cardId: card.id })
                )
              }
              className={`cursor-pointer rounded-full hover:bg-blue-600 text-white font-semibold px-2 py-1 transition-colors ${card.copyMode ? "!text-blue-500" : "text-zinc-600"}`}
            >
              {/* {card.copyMode ? "Copy On" : "Copy Off"} */}
              <Copy size={16} />
            </button>
          </div>
          <button
            type="button"
            className=" text-red-500 hover:text-white cursor-pointer"
            onClick={() =>
              dispatch(deleteCard({ columnId: column.id, cardId: card.id }))
            }
            aria-label="Delete card"
          >
            <Trash2 size={16} />
          </button>
        </div>
        {/* Dynamic fields */}
        {/* <div className="">
          {column.fields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm text-slate-400">{field.label}</span>

              <textarea
                rows={1} // ⬅️ starts at one row
                value={card.values[field.key] ?? ""}
                onChange={(e) => {
                  dispatch(
                    updateCardValue({
                      columnId: column.id,
                      cardId: card.id,
                      fieldKey: field.key,
                      value: e.target.value,
                    })
                  );
                  e.target.style.height = "auto"; // 🪄 reset height
                  e.target.style.height = `${e.target.scrollHeight}px`; // grow as needed
                }}
                className="w-full rounded-md bg-zinc-800 text-white  overflow-hidden"
                style={{ minHeight: "2.25rem", lineHeight: "1.5rem" }} // optional tuning
              />
            </label>
          ))}
        </div> */}
        {/* Custom card-specific fields */}
        {customKeys.map((key) => (
          <label key={key} className="block mt-1">
            <span className="text-sm text-slate-400">{key}</span>
            <textarea
              rows={1}
              value={card.values[key]}
              onChange={(e) => {
                dispatch(
                  updateCardValue({
                    columnId: column.id,
                    cardId: card.id,
                    fieldKey: key,
                    value: e.target.value,
                  })
                );
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full rounded-lg py-1 px-2 bg-zinc-800 text-white  overflow-hidden"
              style={{ minHeight: "2.25rem", lineHeight: "1.5rem" }} // optional tuning
            />
          </label>
        ))}
        {/* dropbox */}
        {/* <div
          ref={mergeDropRef}
          className={`mb-2 p-2 rounded-md bg-zinc-900 text-center text-sm transition-all duration-300 ease-in-out hover:border-blue-500
    ${
      state.type === "is-over"
        ? "border-blue-500 shadow-md shadow-blue-500/30 scale-[1.03]"
        : "border-zinc-700"
    }`}
        >
          Drop card here to merge
        </div> */}
        {/* merged cards */}
        {card.mergedCards && card.mergedCards.length > 0 && (
          <div className="mt-1 rounded-lg bg-zinc-950 border border-zinc-800 shadow-inner">
            <div className="p-1 flex w-full justify-center items-center text-xs text-zinc-500 border-b border-zinc-700">
              Work Orders Assigned
            </div>

            {/* Subcolumn for merged cards */}
            <div className="p-1 flex flex-col gap-1">
              <button
                className="text-xs text-red-500 hover:text-white my-1 cursor-pointer "
                onClick={() => {
                  dispatch(
                    clearMergedCards({ columnId: column.id, cardId: card.id })
                  );
                }}
              >
                Clear All Merged Work Orders
              </button>

              {card.mergedCards.map((mergedCard, index) => (
                <MergedCard
                  key={mergedCard.id}
                  card={mergedCard}
                  parentCardId={card.id}
                  columnId={column.id}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
        {/* Add new field */}
        <div className="flex w-full justify-between items-center mt-1">
          <input
            type="text"
            placeholder="Add field (e.g. Notes)"
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            className="flex-1 px-2 py-1 rounded-md bg-zinc-800 text-white placeholder:text-zinc-500 outline-hidden transition-colors duration-200 text-sm hover:bg-zinc-700 mr-1"
          />
          <button
            type="button"
            onClick={() => {
              const key = newFieldLabel.toLowerCase().replace(/\s+/g, "_");
              if (key && !card.values[key]) {
                dispatch(
                  updateCardValue({
                    columnId: column.id,
                    cardId: card.id,
                    fieldKey: key,
                    value: "",
                  })
                );
              }
              setNewFieldLabel("");
            }}
            className="px-2 rounded-lg bg-purple-500 hover:bg-blue-600 transition-colors duration-200 cursor-pointer text-white"
          >
            Add
          </button>
        </div>
        <button
          type="button"
          className="px-2 py-1 mt-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs cursor-pointer"
          onClick={() => {
            const fieldKeys = Object.keys(card.values);
            if (fieldKeys.length === 0) return;

            const newCard: TCard = {
              id: `card:${crypto.randomUUID()}`,
              values: Object.fromEntries(fieldKeys.map((key) => [key, ""])),
              copyMode: false,
              createdInColumnId: column.title, // ⬅️ track origin consistently
              createdAt: Date.now(), // ⬅️ preserve audit info
            };

            console.log("[CardDisplay.tsx] Copy Schema - new card:", newCard);
            dispatch(addCard({ columnId: column.id, card: newCard }));
          }}
        >
          Copy Schema
        </button>
      </div>

      {state.type === "is-over" && state.closestEdge === "bottom" && (
        <CardShadow dragging={state.dragging} />
      )}
    </div>
  );
}

export function Card({ card, column }: { card: TCard; column: TColumn }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<TCardState>(idle);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    invariant(outer && inner);

    return combine(
      draggable({
        // element: inner,
        element: dragHandleRef.current!,
        getInitialData: ({ element }) =>
          getCardData({
            card,
            columnId: column.id,
            rect: element.getBoundingClientRect(),
          }),
        onGenerateDragPreview({ nativeSetDragImage, location, source }) {
          const data = source.data;
          invariant(isCardData(data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: inner,
              input: location.current.input,
            }),
            render({ container }) {
              setState({
                type: "preview",
                container,
                dragging: inner.getBoundingClientRect(),
              });
            },
          });
        },
        onDragStart() {
          setState({ type: "is-dragging" });
        },
        // onDrop() {
        //   setState(idle);
        // },

        onDrop({ source, location }) {
          if (!isCardData(source.data)) return;

          const sourceCardId = source.data.card.id;
          const targetDrop = location.current.dropTargets.find((dt) =>
            isCardDropTargetData(dt.data)
          );

          // if (!targetDrop || sourceCardId === targetDrop.data.card.id) {
          //   setState(idle);
          //   return;
          // }
          const targetData = getCardDropTargetDataSafe(targetDrop);

          if (
            !targetDrop ||
            !targetData ||
            sourceCardId === targetData.card.id
          ) {
            setState(idle);
            return;
          }

          // ✅ ⛔️ Abort reordering if source is in copy mode
          if (source.data.card.copyMode) {
            console.log(`[Card.tsx] Skipping reordering — copyMode is ON`);
            setState(idle);
            return;
          }

          // ✅ Otherwise, continue with reordering
          const columnCards = column.cards;
          const fromIndex = columnCards.findIndex((c) => c.id === sourceCardId);

          const toIndex = columnCards.findIndex(
            (c) => c.id === targetData.card.id
          );

          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            const before = extractClosestEdge(targetDrop.data) === "top";
            const targetIndex = before ? toIndex : toIndex + 1;

            dispatch(
              reorderCardsInColumn({
                columnId: column.id,
                fromIndex,
                toIndex:
                  targetIndex > fromIndex ? targetIndex - 1 : targetIndex,
              })
            );
          }

          setState(idle);
        },
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        // canDrop: isDraggingACard,
        canDrop({ source }) {
          if (!isCardData(source.data)) return false;
          return !source.data.card.copyMode; // ✅ allow reordering only if copyMode is OFF
        },
        getData: ({ element, input }) =>
          attachClosestEdge(
            getCardDropTargetData({ card, columnId: column.id }),
            {
              element,
              input,
              allowedEdges: ["top", "bottom"],
            }
          ),
        onDragEnter({ source, self }) {
          if (!isCardData(source.data)) return;
          if (source.data.card.id === card.id) return;
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          setState({
            type: "is-over",
            dragging: source.data.rect,
            closestEdge,
          });
        },
        onDrag({ source, self }) {
          if (!isCardData(source.data)) return;
          if (source.data.card.id === card.id) return;
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          const proposed: TCardState = {
            type: "is-over",
            dragging: source.data.rect,
            closestEdge,
          };
          setState((current) =>
            isShallowEqual(proposed, current) ? current : proposed
          );
        },
        onDragLeave({ source }) {
          if (!isCardData(source.data)) return;
          if (source.data.card.id === card.id) {
            setState({ type: "is-dragging-and-left-self" });
            return;
          }
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      })
    );
  }, [card, column]);

  return (
    <>
      <CardDisplay
        outerRef={outerRef}
        innerRef={innerRef}
        dragHandleRef={dragHandleRef}
        state={state}
        card={card}
        column={column}
      />
      {state.type === "preview"
        ? createPortal(
            <CardDisplay state={state} card={card} column={column} />,
            state.container
          )
        : null}
    </>
  );
}

// export function MiniCard({
//   card,
//   onDelete,
// }: {
//   card: TCard;
//   onDelete?: () => void;
// }) {
//   return (
//     <div className="bg-zinc-900 p-2 rounded mb-2 text-xs border border-zinc-700 shadow-sm">
//       <div className="flex justify-between items-center mb-2">
//         <div className="italic text-slate-400">
//           Origin: {card.createdInColumnId ?? "unknown"}
//         </div>
//         {onDelete && (
//           <button
//             className="text-red-500 hover:text-white"
//             onClick={onDelete}
//             aria-label="Delete merged card"
//           >
//             <Trash2 size={14} />
//           </button>
//         )}
//       </div>
//       {Object.entries(card.values).map(([key, value]) => (
//         <div key={key} className="mb-1">
//           <span className="font-semibold text-white">{key}:</span>{" "}
//           <span className="text-slate-300">{value}</span>
//         </div>
//       ))}
//     </div>
//   );
// }

export function MergedCard({
  card,
  parentCardId,
  columnId,
  index,
}: {
  card: TCard;
  parentCardId: string;
  columnId: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<TCardState>(idle);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: ({ element }) => ({
        type: "merged-card",
        card,
        index,
        rect: element.getBoundingClientRect(),
        parentCardId,
        columnId,
      }),
      onDragStart: () => setState({ type: "is-dragging" }),
      onDrop: () => setState(idle),
    });
  }, [card, index, parentCardId, columnId]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getIsSticky: () => true,
      canDrop({ source }) {
        return (
          source.data.type === "merged-card" &&
          source.data.parentCardId === parentCardId
        );
      },
      getData: ({ element, input }) =>
        attachClosestEdge(
          { card }, // ⬅️ user-defined metadata
          {
            element,
            input,
            allowedEdges: ["top", "bottom"],
          }
        ),

      onDrag({ source, self }) {
        // if (source.data.card.id === card.id) return;
        if (!isDraggingAMergedCard(source.data)) return;
        if (source.data.card.id === card.id) return;

        const closestEdge = extractClosestEdge(self.data);
        if (!closestEdge) return;

        const proposed: TCardState = {
          type: "is-over",
          dragging: source.data.rect,
          closestEdge,
        };
        setState((current) =>
          isShallowEqual(proposed, current) ? current : proposed
        );
      },
      onDrop({ source }) {
        // if (source.data.card.id === card.id) return;
        if (!isMergedCardData(source.data)) return;
        if (source.data.card.id === card.id) return;

        dispatch(
          reorderMergedCards({
            columnId,
            cardId: parentCardId,
            fromIndex: source.data.index,
            toIndex: index,
          })
        );
        setState(idle);
      },
      onDragLeave() {
        setState(idle);
      },
    });
  }, [card, index, parentCardId, columnId]);

  return (
    <div
      ref={ref}
      className={`p-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs shadow ${
        state.type === "is-over" ? "ring ring-blue-500" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="italic text-slate-400">
          Origin: {card.createdInColumnId ?? "unknown"}
        </div>
        <button
          onClick={() =>
            dispatch(
              removeMergedCard({
                columnId,
                parentCardId,
                mergedCardId: card.id,
              })
            )
          }
          aria-label="Delete"
          className="text-red-500 hover:text-white cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {Object.entries(card.values).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-semibold text-white">{key}:</span>{" "}
          <span className="text-slate-300">{value}</span>
        </div>
      ))}
    </div>
  );
}
