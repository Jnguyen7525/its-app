import { TBoard, TCard, TColumn } from '@/shared/data';
import { Board } from '@/shared/board';

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
    { id: 'column:a', title: 'Column A', cards: getCards({ amount: 30 }) },
    { id: 'column:b', title: 'Column B', cards: getCards({ amount: 5 }) },
  ];

  return {
    columns,
  };
}

export default function Page() {
  return (
    <div className="h-full md:flex md:flex-row md:justify-center">
      <Board initial={getInitialData()} />
    </div>
  );
}
