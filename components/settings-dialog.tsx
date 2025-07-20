'use client';

import { TFields, TSelectField, TSettings } from '@/shared/settings';
import { SettingsContext } from '@/shared/settings-context';
import { Gift } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, Fragment, useContext } from 'react';

type TBooleanFields = {
  [TKey in keyof TFields]: TFields[TKey]['type'] extends 'boolean' ? TFields[TKey] : never;
};

function BooleanField<TFieldKey extends keyof TBooleanFields>({
  fieldKey,
  fields,
  value,
}: {
  fields: TFields;
  fieldKey: TFieldKey;
  // TODO: better?
  value: boolean;
}) {
  const { update } = useContext(SettingsContext);
  const field = fields[fieldKey];
  return (
    <label className="flex flex-row gap-2 rounded border p-2">
      <div className="flex grow flex-col">
        <span className="font-bold">{field.title}</span>
        <span className="text-balance text-sm">{field.description}</span>
      </div>
      <input type="checkbox" checked={value} onChange={() => update({ [fieldKey]: !value })} />
    </label>
  );
}

function SelectField({
  field,
  fieldKey,
  value,
}: {
  field: TSelectField<string>;
  fieldKey: keyof TSettings;
  value: string;
}) {
  const { update } = useContext(SettingsContext);
  return (
    <div className="flex flex-col gap-2 rounded border p-2">
      <span className="font-bold">{field.title}</span>
      <span className="text-balance text-sm">{field.description}</span>
      <select
        className="rounded p-2"
        value={value}
        onChange={(event) => update({ [fieldKey]: event.target.value })}
      >
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

type TCredit = {
  title: string;
  href: string;
};

const credits: TCredit[] = [
  {
    title: 'Pragmatic drag and drop',
    href: 'https://github.com/atlassian/pragmatic-drag-and-drop',
  },
  {
    title: 'React',
    href: 'https://react.dev/',
  },
  {
    title: 'Tailwind',
    href: 'https://tailwindcss.com/',
  },
  {
    title: 'Lucide',
    href: 'https://lucide.dev/',
  },
];

function Credit({ credit }: { credit: TCredit }) {
  return (
    <Link
      key={credit.href}
      className="text-sky-800 hover:text-sky-700 active:text-sky-900"
      target="_blank"
      href={credit.href}
    >
      {credit.title}
    </Link>
  );
}

export const SettingsDialog = forwardRef<HTMLDivElement>(function SettingsDialog(props, ref) {
  const { settings, fields, reset } = useContext(SettingsContext);

  return (
    <div
      className="absolute right-0 top-11 z-10 flex max-h-[60vh] w-80 flex-col overflow-y-auto rounded bg-slate-100"
      ref={ref}
    >
      <div className="flex select-none flex-col gap-2 p-2">
        {/* Sorry TS :( */}
        {Object.entries(fields).map((value) => {
          const fieldKey = value[0] as keyof typeof fields;
          const field = value[1];
          if (field.type === 'boolean') {
            return (
              <BooleanField
                fields={fields}
                key={fieldKey}
                fieldKey={fieldKey}
                value={settings[fieldKey] as boolean}
              />
            );
          }
          if (field.type === 'select') {
            return (
              <SelectField
                field={field}
                key={fieldKey}
                fieldKey={fieldKey as keyof TSettings}
                value={settings[fieldKey] as string}
              />
            );
          }
          return null;
        })}
        <button
          type="button"
          className="rounded bg-orange-200 p-2 hover:bg-orange-300 active:bg-orange-100"
          onClick={reset}
        >
          Reset defaults
        </button>
      </div>
      <div className="sticky bottom-0 flex flex-row items-center gap-2 text-balance border-t bg-slate-200 p-2 text-sm">
        <Gift size={32} className="text-red-500" />
        <div>
          Made by{' '}
          <Credit credit={{ title: 'Alex Reardon', href: 'https://alexreardon.bsky.social' }} />{' '}
          with{' '}
          {credits.map((credit, index) => (
            <Fragment key={credit.href}>
              {index === credits.length - 1 ? 'and ' : ''}
              <Credit credit={credit} />
              {index === credits.length - 1 ? '.' : ', '}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
});
