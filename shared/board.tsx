// "use client";

// import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
// import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
// import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
// import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
// import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
// import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
// import { useContext, useEffect, useRef, useState } from "react";
// import invariant from "tiny-invariant";
// import { Column } from "./column";
// import {
//   isCardData,
//   isCardDropTargetData,
//   isColumnData,
//   isDraggingACard,
//   isDraggingAColumn,
//   TBoard,
//   TColumn,
// } from "./data";
// import { SettingsContext } from "./settings-context";
// import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
// import { bindAll } from "bind-event-listener";
// import { blockBoardPanningAttr } from "./data-attributes";
// import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
// import AddColumn from "@/components/add-column";
// import { useAppDispatch, useAppSelector } from "@/state/redux";
// import { addColumn } from "@/state/board";

// export function Board({ initial }: { initial: TBoard }) {
//   const [data, setData] = useState(initial);
//   const scrollableRef = useRef<HTMLDivElement | null>(null);
//   const { settings } = useContext(SettingsContext);

//   const dispatch = useAppDispatch();
//   const columns = useAppSelector((state) => state.board.columns);

//   const handleAddColumn = (title: string) => {
//     dispatch(addColumn({ title }));
//   };

//   // const [columns, setColumns] = useState<TColumn[]>([]);

//   // const handleAddColumn = (title: string) => {
//   //   const newColumn: TColumn = {
//   //     id: `column:${crypto.randomUUID()}`,
//   //     title,
//   //     cards: [
//   //       {
//   //         id: `card: paint`,
//   //         description: `Card paint`,
//   //       },
//   //     ],
//   //   };

//   //   setData((prev) => ({
//   //     ...prev,
//   //     columns: [...prev.columns, newColumn],
//   //   }));
//   // };

//   useEffect(() => {
//     const element = scrollableRef.current;
//     invariant(element);
//     return combine(
//       monitorForElements({
//         canMonitor: isDraggingACard,
//         onDrop({ source, location }) {
//           const dragging = source.data;
//           if (!isCardData(dragging)) {
//             return;
//           }

//           const innerMost = location.current.dropTargets[0];

//           if (!innerMost) {
//             return;
//           }
//           const dropTargetData = innerMost.data;
//           const homeColumnIndex = data.columns.findIndex(
//             (column) => column.id === dragging.columnId
//           );
//           const home: TColumn | undefined = data.columns[homeColumnIndex];

//           if (!home) {
//             return;
//           }
//           const cardIndexInHome = home.cards.findIndex(
//             (card) => card.id === dragging.card.id
//           );

//           // dropping on a card
//           if (isCardDropTargetData(dropTargetData)) {
//             const destinationColumnIndex = data.columns.findIndex(
//               (column) => column.id === dropTargetData.columnId
//             );
//             const destination = data.columns[destinationColumnIndex];
//             // reordering in home column
//             if (home === destination) {
//               const cardFinishIndex = home.cards.findIndex(
//                 (card) => card.id === dropTargetData.card.id
//               );

//               // could not find cards needed
//               if (cardIndexInHome === -1 || cardFinishIndex === -1) {
//                 return;
//               }

//               // no change needed
//               if (cardIndexInHome === cardFinishIndex) {
//                 return;
//               }

//               const closestEdge = extractClosestEdge(dropTargetData);

//               const reordered = reorderWithEdge({
//                 axis: "vertical",
//                 list: home.cards,
//                 startIndex: cardIndexInHome,
//                 indexOfTarget: cardFinishIndex,
//                 closestEdgeOfTarget: closestEdge,
//               });

//               const updated: TColumn = {
//                 ...home,
//                 cards: reordered,
//               };
//               const columns = Array.from(data.columns);
//               columns[homeColumnIndex] = updated;
//               setData({ ...data, columns });
//               return;
//             }

//             // moving card from one column to another

//             // unable to find destination
//             if (!destination) {
//               return;
//             }

//             const indexOfTarget = destination.cards.findIndex(
//               (card) => card.id === dropTargetData.card.id
//             );

//             const closestEdge = extractClosestEdge(dropTargetData);
//             const finalIndex =
//               closestEdge === "bottom" ? indexOfTarget + 1 : indexOfTarget;

//             // remove card from home list
//             const homeCards = Array.from(home.cards);
//             homeCards.splice(cardIndexInHome, 1);

//             // insert into destination list
//             const destinationCards = Array.from(destination.cards);
//             destinationCards.splice(finalIndex, 0, dragging.card);

//             const columns = Array.from(data.columns);
//             columns[homeColumnIndex] = {
//               ...home,
//               cards: homeCards,
//             };
//             columns[destinationColumnIndex] = {
//               ...destination,
//               cards: destinationCards,
//             };
//             setData({ ...data, columns });
//             return;
//           }

//           // dropping onto a column, but not onto a card
//           if (isColumnData(dropTargetData)) {
//             const destinationColumnIndex = data.columns.findIndex(
//               (column) => column.id === dropTargetData.column.id
//             );
//             const destination = data.columns[destinationColumnIndex];

//             if (!destination) {
//               return;
//             }

//             // dropping on home
//             if (home === destination) {
//               console.log("moving card to home column");

//               // move to last position
//               const reordered = reorder({
//                 list: home.cards,
//                 startIndex: cardIndexInHome,
//                 finishIndex: home.cards.length - 1,
//               });

//               const updated: TColumn = {
//                 ...home,
//                 cards: reordered,
//               };
//               const columns = Array.from(data.columns);
//               columns[homeColumnIndex] = updated;
//               setData({ ...data, columns });
//               return;
//             }

//             console.log("moving card to another column");

//             // remove card from home list

//             const homeCards = Array.from(home.cards);
//             homeCards.splice(cardIndexInHome, 1);

//             // insert into destination list
//             const destinationCards = Array.from(destination.cards);
//             destinationCards.splice(destination.cards.length, 0, dragging.card);

//             const columns = Array.from(data.columns);
//             columns[homeColumnIndex] = {
//               ...home,
//               cards: homeCards,
//             };
//             columns[destinationColumnIndex] = {
//               ...destination,
//               cards: destinationCards,
//             };
//             setData({ ...data, columns });
//             return;
//           }
//         },
//       }),
//       monitorForElements({
//         canMonitor: isDraggingAColumn,
//         onDrop({ source, location }) {
//           const dragging = source.data;
//           if (!isColumnData(dragging)) {
//             return;
//           }

//           const innerMost = location.current.dropTargets[0];

//           if (!innerMost) {
//             return;
//           }
//           const dropTargetData = innerMost.data;

//           if (!isColumnData(dropTargetData)) {
//             return;
//           }

//           const homeIndex = data.columns.findIndex(
//             (column) => column.id === dragging.column.id
//           );
//           const destinationIndex = data.columns.findIndex(
//             (column) => column.id === dropTargetData.column.id
//           );

//           if (homeIndex === -1 || destinationIndex === -1) {
//             return;
//           }

//           if (homeIndex === destinationIndex) {
//             return;
//           }

//           const reordered = reorder({
//             list: data.columns,
//             startIndex: homeIndex,
//             finishIndex: destinationIndex,
//           });
//           setData({ ...data, columns: reordered });
//         },
//       }),
//       autoScrollForElements({
//         canScroll({ source }) {
//           if (!settings.isOverElementAutoScrollEnabled) {
//             return false;
//           }

//           return isDraggingACard({ source }) || isDraggingAColumn({ source });
//         },
//         getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
//         element,
//       }),
//       unsafeOverflowAutoScrollForElements({
//         element,
//         getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
//         canScroll({ source }) {
//           if (!settings.isOverElementAutoScrollEnabled) {
//             return false;
//           }

//           if (!settings.isOverflowScrollingEnabled) {
//             return false;
//           }

//           return isDraggingACard({ source }) || isDraggingAColumn({ source });
//         },
//         getOverflow() {
//           return {
//             forLeftEdge: {
//               top: 1000,
//               left: 1000,
//               bottom: 1000,
//             },
//             forRightEdge: {
//               top: 1000,
//               right: 1000,
//               bottom: 1000,
//             },
//           };
//         },
//       })
//     );
//   }, [data, settings]);

//   // Panning the board
//   useEffect(() => {
//     let cleanupActive: CleanupFn | null = null;
//     const scrollable = scrollableRef.current;
//     invariant(scrollable);

//     function begin({ startX }: { startX: number }) {
//       let lastX = startX;

//       const cleanupEvents = bindAll(
//         window,
//         [
//           {
//             type: "pointermove",
//             listener(event) {
//               const currentX = event.clientX;
//               const diffX = lastX - currentX;

//               lastX = currentX;
//               scrollable?.scrollBy({ left: diffX });
//             },
//           },
//           // stop panning if we see any of these events
//           ...(
//             [
//               "pointercancel",
//               "pointerup",
//               "pointerdown",
//               "keydown",
//               "resize",
//               "click",
//               "visibilitychange",
//             ] as const
//           ).map((eventName) => ({
//             type: eventName,
//             listener: () => cleanupEvents(),
//           })),
//         ],
//         // need to make sure we are not after the "pointerdown" on the scrollable
//         // Also this is helpful to make sure we always hear about events from this point
//         { capture: true }
//       );

//       cleanupActive = cleanupEvents;
//     }

//     const cleanupStart = bindAll(scrollable, [
//       {
//         type: "pointerdown",
//         listener(event) {
//           if (!(event.target instanceof HTMLElement)) {
//             return;
//           }
//           // ignore interactive elements
//           if (event.target.closest(`[${blockBoardPanningAttr}]`)) {
//             return;
//           }

//           begin({ startX: event.clientX });
//         },
//       },
//     ]);

//     return function cleanupAll() {
//       cleanupStart();
//       cleanupActive?.();
//     };
//   }, []);

//   return (
//     <div
//       className={`flex h-full flex-col ${settings.isBoardMoreObvious ? "px-32 py-20" : ""}`}
//     >
//       <div
//         className={`flex h-full flex-row gap-3 overflow-x-auto p-3 [scrollbar-color:var(--color-sky-600)_var(--color-sky-800)] [scrollbar-width:thin] ${settings.isBoardMoreObvious ? "rounded border-2 border-dashed" : ""}`}
//         ref={scrollableRef}
//       >
//         {data.columns.map((column) => (
//           <Column key={column.id} column={column} />
//         ))}
//         {/* <Column
//           key={"new column"}
//           column={{
//             id: "add new column",
//             title: "Add a new column",
//             cards: [{ id: "a", description: "b" }],
//           }}
//         /> */}
//         <div
//           className="flex h-full flex-row gap-3 overflow-x-auto p-3 ..."
//           ref={scrollableRef}
//         >
//           {columns.map((column) => (
//             <Column key={column.id} column={column} />
//           ))}
//           <AddColumn onAdd={handleAddColumn} />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { useContext, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { Column } from "./column";
import {
  isCardData,
  isCardDropTargetData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  TBoard,
  TCardField,
  TColumn,
} from "./data";
import { SettingsContext } from "./settings-context";
import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
import { bindAll } from "bind-event-listener";
import { blockBoardPanningAttr } from "./data-attributes";
import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import AddColumn from "@/components/add-column";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import {
  addColumn,
  moveCard,
  reorderCardsInColumn,
  reorderColumns,
} from "@/state/board";

// export function Board({ initial }: { initial: TBoard }) {
export function Board() {
  // const [data, setData] = useState(initial);
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useContext(SettingsContext);

  const dispatch = useAppDispatch();
  const columns = useAppSelector((state) => state.board.columns);

  // const handleAddColumn = (title: string) => {
  //   console.log("[Board] handleAddColumn:", title);

  //   dispatch(addColumn({ title }));
  // };
  // const handleAddColumn = (title: string, fields: TCardField[]) => {
  //   console.log("[Board] handleAddColumn:", title, fields);
  //   dispatch(addColumn({ title, fields }));
  // };

  useEffect(() => {
    console.log("Board mounted");
  }, []);

  // const [columns, setColumns] = useState<TColumn[]>([]);

  // const handleAddColumn = (title: string) => {
  //   const newColumn: TColumn = {
  //     id: `column:${crypto.randomUUID()}`,
  //     title,
  //     cards: [
  //       {
  //         id: `card: paint`,
  //         description: `Card paint`,
  //       },
  //     ],
  //   };

  //   setData((prev) => ({
  //     ...prev,
  //     columns: [...prev.columns, newColumn],
  //   }));
  // };

  useEffect(() => {
    const element = scrollableRef.current;
    invariant(element);
    const localColumns = columns; // ✅ capture snapshot early
    if (!localColumns) {
      console.log("no columns");
      return;
    }

    return combine(
      monitorForElements({
        canMonitor: isDraggingACard,
        onDrop({ source, location }) {
          const dragging = source.data;
          // 🔍 Add the log here
          console.log("Dropped card:", dragging.card);

          if (!isCardData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];

          if (!innerMost) {
            return;
          }
          const dropTargetData = innerMost.data;
          const homeColumnIndex = localColumns.findIndex(
            (column) => column.id === dragging.columnId
          );
          const home: TColumn | undefined = localColumns[homeColumnIndex];

          if (!home) {
            return;
          }
          const cardIndexInHome = home.cards.findIndex(
            (card) => card.id === dragging.card.id
          );

          // dropping on a card
          if (isCardDropTargetData(dropTargetData)) {
            const destinationColumnIndex = columns.findIndex(
              (column) => column.id === dropTargetData.columnId
            );
            const destination = columns[destinationColumnIndex];
            // reordering in home column
            if (home === destination) {
              const cardFinishIndex = home.cards.findIndex(
                (card) => card.id === dropTargetData.card.id
              );

              // could not find cards needed
              if (cardIndexInHome === -1 || cardFinishIndex === -1) {
                return;
              }

              // no change needed
              if (cardIndexInHome === cardFinishIndex) {
                return;
              }

              // const closestEdge = extractClosestEdge(dropTargetData);

              // const reordered = reorderWithEdge({
              //   axis: "vertical",
              //   list: home.cards,
              //   startIndex: cardIndexInHome,
              //   indexOfTarget: cardFinishIndex,
              //   closestEdgeOfTarget: closestEdge,
              // });

              // const updated: TColumn = {
              //   ...home,
              //   cards: reordered,
              // };
              // const columns = Array.from(columns);
              // columns[homeColumnIndex] = updated;
              // setData({ ...data, columns });

              dispatch(
                reorderCardsInColumn({
                  columnId: home.id,
                  fromIndex: cardIndexInHome,
                  toIndex: cardFinishIndex,
                })
              );
              return;
            }

            // moving card from one column to another

            // unable to find destination
            if (!destination) {
              return;
            }

            const indexOfTarget = destination.cards.findIndex(
              (card) => card.id === dropTargetData.card.id
            );

            const closestEdge = extractClosestEdge(dropTargetData);
            const finalIndex =
              closestEdge === "bottom" ? indexOfTarget + 1 : indexOfTarget;

            // remove card from home list
            const homeCards = Array.from(home.cards);
            homeCards.splice(cardIndexInHome, 1);

            // insert into destination list
            const destinationCards = Array.from(destination.cards);
            destinationCards.splice(finalIndex, 0, dragging.card);

            // const localColumns = Array.from(columns);
            // columns[homeColumnIndex] = {
            //   ...home,
            //   cards: homeCards,
            // };
            // columns[destinationColumnIndex] = {
            //   ...destination,
            //   cards: destinationCards,
            // };
            // 🪵 Add the log here, before dispatch
            console.log("Dispatching moveCard", {
              fromColumnId: home.id,
              toColumnId: destination.id,
              cardId: dragging.card.id,
              destinationIndex: finalIndex,
            });

            dispatch(
              moveCard({
                fromColumnId: home.id,
                toColumnId: destination.id,
                cardId: dragging.card.id,
                destinationIndex: finalIndex,
              })
            );

            return;
          }

          // dropping onto a column, but not onto a card
          if (isColumnData(dropTargetData)) {
            const destinationColumnIndex = localColumns.findIndex(
              (column) => column.id === dropTargetData.column.id
            );
            const destination = localColumns[destinationColumnIndex];

            if (!destination) {
              return;
            }

            // dropping on home
            if (home === destination) {
              console.log("moving card to home column");

              // move to last position
              const reordered = reorder({
                list: home.cards,
                startIndex: cardIndexInHome,
                finishIndex: home.cards.length - 1,
              });

              const updated: TColumn = {
                ...home,
                cards: reordered,
              };
              const columns = Array.from(localColumns);
              columns[homeColumnIndex] = updated;
              dispatch(
                reorderCardsInColumn({
                  columnId: home.id,
                  fromIndex: cardIndexInHome,
                  toIndex: home.cards.length - 1,
                })
              );

              return;
            }

            console.log("moving card to another column");

            // remove card from home list

            const homeCards = Array.from(home.cards);
            homeCards.splice(cardIndexInHome, 1);

            // insert into destination list
            const destinationCards = Array.from(destination.cards);
            destinationCards.splice(destination.cards.length, 0, dragging.card);

            const columns = Array.from(localColumns);
            columns[homeColumnIndex] = {
              ...home,
              cards: homeCards,
            };
            columns[destinationColumnIndex] = {
              ...destination,
              cards: destinationCards,
            };
            dispatch(
              moveCard({
                fromColumnId: home.id,
                toColumnId: destination.id,
                cardId: dragging.card.id,
                destinationIndex: destination.cards.length, // append at end
              })
            );

            return;
          }
        },
      }),
      monitorForElements({
        canMonitor: isDraggingAColumn,
        onDrop({ source, location }) {
          const dragging = source.data;
          if (!isColumnData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];

          if (!innerMost) {
            return;
          }
          const dropTargetData = innerMost.data;

          if (!isColumnData(dropTargetData)) {
            return;
          }

          const homeIndex = columns.findIndex(
            (column) => column.id === dragging.column.id
          );
          const destinationIndex = columns.findIndex(
            (column) => column.id === dropTargetData.column.id
          );

          if (homeIndex === -1 || destinationIndex === -1) {
            return;
          }

          if (homeIndex === destinationIndex) {
            return;
          }

          const reordered = reorder({
            list: columns,
            startIndex: homeIndex,
            finishIndex: destinationIndex,
          });
          dispatch(
            reorderColumns({
              fromIndex: homeIndex,
              toIndex: destinationIndex,
            })
          );
        },
      }),
      autoScrollForElements({
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) {
            return false;
          }

          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
        getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
        element,
      }),
      unsafeOverflowAutoScrollForElements({
        element,
        getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) {
            return false;
          }

          if (!settings.isOverflowScrollingEnabled) {
            return false;
          }

          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
        getOverflow() {
          return {
            forLeftEdge: {
              top: 1000,
              left: 1000,
              bottom: 1000,
            },
            forRightEdge: {
              top: 1000,
              right: 1000,
              bottom: 1000,
            },
          };
        },
      })
    );
  }, [columns, settings]);

  // Panning the board
  useEffect(() => {
    let cleanupActive: CleanupFn | null = null;
    const scrollable = scrollableRef.current;
    invariant(scrollable);

    function begin({ startX }: { startX: number }) {
      let lastX = startX;

      const cleanupEvents = bindAll(
        window,
        [
          {
            type: "pointermove",
            listener(event) {
              const currentX = event.clientX;
              const diffX = lastX - currentX;

              lastX = currentX;
              scrollable?.scrollBy({ left: diffX });
            },
          },
          // stop panning if we see any of these events
          ...(
            [
              "pointercancel",
              "pointerup",
              "pointerdown",
              "keydown",
              "resize",
              "click",
              "visibilitychange",
            ] as const
          ).map((eventName) => ({
            type: eventName,
            listener: () => cleanupEvents(),
          })),
        ],
        // need to make sure we are not after the "pointerdown" on the scrollable
        // Also this is helpful to make sure we always hear about events from this point
        { capture: true }
      );

      cleanupActive = cleanupEvents;
    }

    const cleanupStart = bindAll(scrollable, [
      {
        type: "pointerdown",
        listener(event) {
          if (!(event.target instanceof HTMLElement)) {
            return;
          }
          // ignore interactive elements
          if (event.target.closest(`[${blockBoardPanningAttr}]`)) {
            return;
          }

          begin({ startX: event.clientX });
        },
      },
    ]);

    return function cleanupAll() {
      cleanupStart();
      cleanupActive?.();
    };
  }, []);

  return (
    <div
      className={`flex h-full w-full flex-col ${settings.isBoardMoreObvious ? "px-32 py-20" : ""}`}
    >
      <div
        className={`flex h-full flex-row gap-3 overflow-x-auto p-5 scrollbar-thumb-rounded-3xl scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-900 ${settings.isBoardMoreObvious ? "rounded border-2 border-dashed" : ""}`}
        ref={scrollableRef}
      >
        {/* {columns.map((column) => (
          <Column key={column.id} column={column} />
        ))} */}
        {/* <Column
          key={"new column"}
          column={{
            id: "add new column",
            title: "Add a new column",
            cards: [{ id: "a", description: "b" }],
          }}
        /> */}
        <div
          className="flex h-full w-full flex-col sm:flex-row gap-3 ..."
          ref={scrollableRef}
        >
          {columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
          {/* <AddColumn onAdd={handleAddColumn} /> */}
        </div>
      </div>
    </div>
  );
}
