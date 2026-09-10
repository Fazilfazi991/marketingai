import Link from "next/link";

export type ClientMetric = {
  label: string;
  value: number | string;
  note?: string;
  href?: string;
};

export function ClientMetricGrid({
  items,
  label,
  compactRow = false,
}: {
  items: ClientMetric[];
  label: string;
  compactRow?: boolean;
}) {
  return (
    <div
      className={`client-metric-grid${compactRow ? " compact-row" : ""}`}
      aria-label={label}
    >
      {items.map((item) => (
        <article key={item.label}>
          {item.href ? (
            <Link href={item.href}>
              <span>{item.label}</span>
              <strong>
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </strong>
              {item.note && <small>{item.note}</small>}
            </Link>
          ) : (
            <div>
              <span>{item.label}</span>
              <strong>
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </strong>
              {item.note && <small>{item.note}</small>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
