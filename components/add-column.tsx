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
  // onAdd: (title: string) => void;
  onAdd: (title: string, fields: TCardField[]) => void;
}) {
  const [title, setTitle] = useState("");

  const [fields, setFields] = useState<TCardField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault(); // ⛑️ prevents duplicate trigger
  //   if (title.trim().length > 0) {
  //     onAdd(title.trim());
  //     setTitle("");
  //   }
  // };
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

  // return (
  //   <form
  //     onSubmit={handleSubmit}
  //     className="min-w-[250px] p-4 bg-zinc-800 rounded"
  //   >
  //     <input
  //       type="text"
  //       placeholder="New column name"
  //       value={title}
  //       onChange={(e) => setTitle(e.target.value)}
  //       className="w-full px-2 py-1 mb-2 rounded bg-zinc-700 text-white"
  //     />
  //     <button
  //       type="button"
  //       onClick={handleSubmit}
  //       className="w-full py-1 rounded bg-sky-600 hover:bg-sky-700 text-white"
  //     >
  //       Add Column
  //     </button>
  //   </form>
  // );
  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-[250px] p-4 bg-zinc-800 rounded text-white"
    >
      <input
        type="text"
        placeholder="New column name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-2 py-1 mb-2 rounded bg-zinc-700 text-white"
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
            className="flex-1 px-2 py-1 rounded bg-zinc-700 text-white"
          />
          <button
            type="button"
            onClick={handleAddField}
            className="px-3 rounded bg-sky-600 hover:bg-sky-700 text-white"
          >
            Add Field
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-1 mt-4 rounded bg-sky-600 hover:bg-sky-700 text-white"
      >
        Create Column
      </button>
    </form>
  );
}
