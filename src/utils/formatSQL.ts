import sqlFormatter from 'sql-formatter-plus';

export function formatSQL(q: string) {
  return sqlFormatter.format(q).replace(/(\$ \{ .* \})|(\$ __)|(\$ \w+)/g, (m) => {
    return m.replace(/\s/g, '');
  });
}
