interface DateDividerProps {
  date: Date;
}

export default function DateDivider({ date }: DateDividerProps) {
  const formattedDate = date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3 my-6 px-4">
      <div className="grow h-px bg-border" />
      <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        {formattedDate}
      </p>
      <div className="grow h-px bg-border" />
    </div>
  );
}
