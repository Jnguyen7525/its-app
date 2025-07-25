"use client";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Copy, Ellipsis, Plus, TableProperties, Trash2 } from "lucide-react";
import { memo, useContext, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";

import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { Card, CardShadow } from "./card";
import {
  getColumnData,
  isCardData,
  isCardDropTargetData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  TCard,
  TCardData,
  TColumn,
} from "./data";
import { blockBoardPanningAttr } from "./data-attributes";
import { isSafari } from "./is-safari";
import { isShallowEqual } from "./is-shallow-equal";
import { SettingsContext } from "./settings-context";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useAppDispatch } from "@/state/redux";
import { addCard, deleteAllCardsInColumn, deleteColumn } from "@/state/board";

type TColumnState =
  | {
      type: "is-card-over";
      isOverChildCard: boolean;
      dragging: DOMRect;
      draggedCard?: TCard; // ✅ add this
    }
  | {
      type: "is-column-over";
    }
  | {
      type: "idle";
    }
  | {
      type: "is-dragging";
    };

const stateStyles: { [Key in TColumnState["type"]]: string } = {
  idle: "cursor-grab",
  "is-card-over": "outline-solid outline-2 outline-neutral-50",
  "is-dragging": "opacity-40",
  "is-column-over": "bg-slate-900",
};

const idle = { type: "idle" } satisfies TColumnState;

/**
 * A memoized component for rendering out the card.
 *
 * Created so that state changes to the column don't require all cards to be rendered
 */
// const CardList = memo(function CardList({ column }: { column: TColumn }) {
//   return column.cards.map((card) => (
//     <Card key={card.id} card={card} columnId={column.id} />
//   ));
// });
const CardList = memo(function CardList({ column }: { column: TColumn }) {
  console.log(
    `count cards in cardlist: ${column.title} ${column.cards.length}`
  );
  return column.cards.map((card) => (
    <Card key={card.id} card={card} column={column} /> // ✅ pass entire column
  ));
});

export function Column({ column }: { column: TColumn }) {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const outerFullHeightRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useContext(SettingsContext);
  const [state, setState] = useState<TColumnState>(idle);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const outer = outerFullHeightRef.current;
    const scrollable = scrollableRef.current;
    const header = headerRef.current;
    const inner = innerRef.current;
    invariant(outer);
    invariant(scrollable);
    invariant(header);
    invariant(inner);

    const data = getColumnData({ column });

    function setIsCardOver({
      data,
      location,
    }: {
      data: TCardData;
      location: DragLocationHistory;
    }) {
      const innerMost = location.current.dropTargets[0];
      const isOverChildCard = Boolean(
        innerMost && isCardDropTargetData(innerMost.data)
      );

      const proposed: TColumnState = {
        type: "is-card-over",
        dragging: data.rect,
        isOverChildCard,
        draggedCard: data.card, // ✅ store card info here
      };
      // optimization - don't update state if we don't need to.
      setState((current) => {
        if (isShallowEqual(proposed, current)) {
          return current;
        }
        return proposed;
      });
    }

    return combine(
      draggable({
        element: header,
        getInitialData: () => data,
        onGenerateDragPreview({ source, location, nativeSetDragImage }) {
          const data = source.data;
          invariant(isColumnData(data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: header,
              input: location.current.input,
            }),
            render({ container }) {
              // Simple drag preview generation: just cloning the current element.
              // Not using react for this.
              const rect = inner.getBoundingClientRect();
              const preview = inner.cloneNode(true);
              invariant(preview instanceof HTMLElement);
              preview.style.width = `${rect.width}px`;
              preview.style.height = `${rect.height}px`;

              // rotation of native drag previews does not work in safari
              if (!isSafari()) {
                preview.style.transform = "rotate(4deg)";
              }

              container.appendChild(preview);
            },
          });
        },
        onDragStart() {
          setState({ type: "is-dragging" });
        },
        onDrop() {
          setState(idle);
        },
      }),
      dropTargetForElements({
        element: outer,
        getData: () => data,
        canDrop({ source }) {
          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
        getIsSticky: () => true,
        onDragStart({ source, location }) {
          if (isCardData(source.data)) {
            setIsCardOver({ data: source.data, location });
          }
        },
        onDragEnter({ source, location }) {
          if (isCardData(source.data)) {
            setIsCardOver({ data: source.data, location });
            return;
          }
          if (
            isColumnData(source.data) &&
            source.data.column.id !== column.id
          ) {
            setState({ type: "is-column-over" });
          }
        },
        onDropTargetChange({ source, location }) {
          if (isCardData(source.data)) {
            if (source.data.card.copyMode) {
              console.log(
                `[Column.tsx] copyMode is ON — skipping position update`
              );
              return; // ✅ don't call setIsCardOver
            }

            // ✅ safe to update shadow state for movement
            setIsCardOver({ data: source.data, location });
          }
        },
        onDragLeave({ source }) {
          if (
            isColumnData(source.data) &&
            source.data.column.id === column.id
          ) {
            return;
          }
          setState(idle);
        },
        onDrop({ source }) {
          // if (source.data.card.copyMode) {
          //   console.log(`[Column.tsx] copyMode is ON — skipping column drop`);
          //   setState(idle);
          //   return;
          // }

          setState(idle);
        },
      }),
      autoScrollForElements({
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) {
            return false;
          }

          return isDraggingACard({ source });
        },
        getConfiguration: () => ({
          maxScrollSpeed: settings.columnScrollSpeed,
        }),
        element: scrollable,
      }),
      unsafeOverflowAutoScrollForElements({
        element: scrollable,
        getConfiguration: () => ({
          maxScrollSpeed: settings.columnScrollSpeed,
        }),
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) {
            return false;
          }

          if (!settings.isOverflowScrollingEnabled) {
            return false;
          }

          return isDraggingACard({ source });
        },
        getOverflow() {
          return {
            forTopEdge: {
              top: 1000,
            },
            forBottomEdge: {
              bottom: 1000,
            },
          };
        },
      })
    );
  }, [column, settings]);

  const handleAddCard = () => {
    // const newCard: TCard = {
    //   id: `card:${crypto.randomUUID()}`,
    //   values: {},
    // };
    const newCard: TCard = {
      id: `card:${crypto.randomUUID()}`,
      values: {},
      copyMode: false,
      createdInColumnId: column.title, // ⬅️ track origin
      createdAt: Date.now(), // ⬅️ audit timestamp
    };
    console.log("column.tsx handleaddcard:", newCard);

    dispatch(addCard({ columnId: column.id, card: newCard }));
  };

  return (
    <div
      className="flex w-full sm:w-72 shrink-0 select-none flex-col"
      ref={outerFullHeightRef}
    >
      <div
        className={`flex max-h-full flex-col rounded-lg overflow-hidden text-neutral-50 ${stateStyles[state.type]}`}
        ref={innerRef}
        {...{ [blockBoardPanningAttr]: true }}
      >
        {/* Extra wrapping element to make it easy to toggle visibility of content when a column is dragging over */}
        <div
          className={`cursor-default flex max-h-full flex-col gap-0.5 ${state.type === "is-column-over" ? "invisible" : ""}`}
        >
          <div
            className="flex flex-row items-center justify-between px-3 py-1 rounded-md bg-zinc-950"
            ref={headerRef}
          >
            <div className="pl-2 font-bold leading-4 ">{column.title}</div>
            <div className="flex items-center gap-1">
              <div className="text-purple-500 hover:text-purple-600 rounded p-1 hover:bg-slate-700 cursor-pointer">
                <TableProperties size={20} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-slate-700 active:bg-slate-600 cursor-pointer"
                    aria-label="More actions"
                  >
                    <Ellipsis size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-950 text-white border-none p-2">
                  {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator /> */}
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 w-full"
                    onClick={() =>
                      dispatch(deleteAllCardsInColumn({ columnId: column.id }))
                    }
                  >
                    <Trash2 className="text-inherit" />
                    <p>Delete all tasks in this column</p>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 w-full"
                    onClick={() =>
                      dispatch(deleteColumn({ columnId: column.id }))
                    }
                  >
                    <Trash2 className="text-inherit" />
                    <p>Delete column</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div
            className="flex flex-col pr-0.5 gap-2 overflow-y-auto [overflow-anchor:none] scrollbar-thumb-rounded-3xl scrollbar-thin scrollbar-track-rounded  scrollbar-thumb-zinc-950 scrollbar-track-zinc-800 ]"
            ref={scrollableRef}
          >
            <CardList column={column} />
            {state.type === "is-card-over" && !state.isOverChildCard ? (
              <div className="shrink-0 px-3 py-1">
                <CardShadow dragging={state.dragging} />
              </div>
            ) : null}
          </div>
          <div className="flex p-1 rounded-md bg-zinc-950">
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer w-fit"
              // onClick={() => {
              //   const newCard = {
              //     id: `card:${crypto.randomUUID()}`,
              //     description: "New card",
              //   };
              //   dispatch(addCard({ columnId: column.id, card: newCard }));
              // }}
              onClick={handleAddCard}
            >
              <Plus size={16} />
              <div className="leading-4">Add a card</div>
            </button>
            {/* <button
              type="button"
              className="px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
              aria-label="Create card from template"
            >
              <Copy size={16} />
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
