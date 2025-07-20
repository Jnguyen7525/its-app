import { useState } from "react";

export default function AddColumn({
  onAdd,
}: {
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (title.trim().length > 0) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  return (
    <div className="min-w-[250px] p-4 bg-zinc-800 rounded">
      <input
        type="text"
        placeholder="New column name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-2 py-1 mb-2 rounded bg-zinc-700 text-white"
      />
      <button
        onClick={handleSubmit}
        className="w-full py-1 rounded bg-sky-600 hover:bg-sky-700 text-white"
      >
        Add Column
      </button>
    </div>
  );
}
