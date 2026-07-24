import { useLanguage } from "../contexts/LanguageContext";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";

export function DataTable({ columns, rows, empty }) {
  const { t } = useLanguage();

  if (!rows.length) {
    return <EmptyState title={empty || t.noData} message="Try changing filters or create a new item." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.badge ? <Badge tone={column.badge(row)}>{row[column.key]}</Badge> : column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
