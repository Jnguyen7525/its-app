// import { useState } from "react";

import { TCardField } from "@/shared/data";
import { useEffect, useState } from "react";

// export default function AddColumn({
//   onAdd,
// }: {
//   onAdd: (title: string) => void;
// }) {
//   const [title, setTitle] = useState("");

//   const handleSubmit = () => {
//     if (title.trim().length > 0) {
//       onAdd(title.trim());
//       setTitle("");
//     }
//   };

//   return (
//     <div className="min-w-[250px] p-4 bg-zinc-800 rounded">
//       <input
//         type="text"
//         placeholder="New column name"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         className="w-full px-2 py-1 mb-2 rounded bg-zinc-700 text-white"
//       />
//       <button
//         onClick={handleSubmit}
//         className="w-full py-1 rounded bg-sky-600 hover:bg-sky-700 text-white"
//       >
//         Add Column
//       </button>
//     </div>
//   );
// }

export default function AddColumn({
  onAdd,
}: {
  onAdd: (title: string, fields: TCardField[]) => void;
}) {
  const [title, setTitle] = useState("");

  const [fields, setFields] = useState<TCardField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && fields.length > 0) {
      const normalized: TCardField[] = fields.map((f) => ({
        key: f.label.toLowerCase().replace(/\s+/g, "_"),
        label: f.label,
        type: "textarea", // ✅ this is the literal type now
      }));
      onAdd(title.trim(), normalized);
      setTitle("");
      setFields([]);
      setNewFieldLabel("");
    }
  };

  const handleAddField = () => {
    const label = newFieldLabel.trim();
    if (label) {
      setFields([...fields, { key: "", label, type: "textarea" }]);
      setNewFieldLabel("");
    }
  };

  useEffect(() => {
    console.log("[AddColumn] mounted");
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-[250px] w-fit p-4 bg-zinc-950 rounded text-white text-base"
    >
      <input
        type="text"
        placeholder="New column name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-2 py-1 mb-2 rounded-md bg-zinc-800 text-white placeholder:text-zinc-500 outline-hidden transition-colors duration-200 hover:bg-zinc-700"
      />

      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Card fields:</label>
        {fields.map((field, index) => (
          <div key={index} className="mb-1 text-sm">
            • {field.label}
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Field label (e.g. name)"
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            className="flex-1 px-2 py-1 rounded-md bg-zinc-800 text-white placeholder:text-zinc-500 outline-hidden transition-colors duration-200 hover:bg-zinc-700"
          />
          <button
            type="button"
            onClick={handleAddField}
            className="px-2 rounded-md bg-purple-500 hover:bg-blue-600 transition-colors duration-200 cursor-pointer text-white"
          >
            Add Field
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="flex-1 py-1 rounded-md bg-blue-500 hover:bg-blue-600 transition-colors duration-200 cursor-pointer text-white"
        >
          Create Column
        </button>

        <button
          type="button"
          onClick={() => {
            setTitle("");
            setFields([]);
            setNewFieldLabel("");
          }}
          className="flex-1 py-1 rounded-md bg-red-500 hover:bg-red-700 transition-colors duration-200 cursor-pointer text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
