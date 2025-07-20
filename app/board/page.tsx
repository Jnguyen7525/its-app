import { TBoard, TCard, TColumn } from "@/shared/data";
import { Board } from "@/shared/board";
import Sidebar from "@/components/sidebar";
import { FilterBar } from "@/components/filter-bar";

function getInitialData(): TBoard {
  // Doing this so we get consistent ids on server and client
  const getCards = (() => {
    let count: number = 0;

    return function getCards({ amount }: { amount: number }): TCard[] {
      return Array.from({ length: amount }, (): TCard => {
        const id = count++;
        return {
          id: `card:${id}`,
          description: `Card ${id}`,
        };
      });
    };
  })();

  const columns: TColumn[] = [
    { id: "column:a", title: "Column A", cards: getCards({ amount: 10 }) },
    { id: "column:b", title: "Column B", cards: getCards({ amount: 8 }) },
    // { id: "column:c", title: "Column C", cards: getCards({ amount: 8 }) },
    // { id: "column:d", title: "Column D", cards: getCards({ amount: 12 }) },
    // { id: "column:e", title: "Column E", cards: getCards({ amount: 0 }) },
    // { id: "column:f", title: "Column F", cards: getCards({ amount: 4 }) },
    // { id: "column:g", title: "Column G", cards: getCards({ amount: 4 }) },
    // { id: "column:h", title: "Column H", cards: getCards({ amount: 8 }) },
    // { id: "column:i", title: "Column I", cards: getCards({ amount: 9 }) },
  ];

  return {
    columns,
  };
}

export default function Page() {
  return (
    <div className="flex h-full w-full">
      <div className="">
        <Sidebar />
      </div>
      <div className=" flex flex-col w-full overflow-auto border-l border-zinc-900">
        <FilterBar />

        <div className="flex flex-1 overflow-auto bg-zinc-900">
          <div className="scrollbar-thumb-rounded-3xl scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-900 flex flex-col overflow-auto border-l border-zinc-900">
            <div className="flex w-full h-full">
              <Board initial={getInitialData()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
