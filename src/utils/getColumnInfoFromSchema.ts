import { TableFieldSchema } from 'api';

export const getColumnInfoFromSchema = (
  column: string,
  schema: TableFieldSchema[]
): { type?: string; description?: string } | null => {
  const c = column.split('.');

  for (let i = 0; i < c.length; i++) {
    const f = schema.find((f) => f.name === c[i]);

    if (f && c[i + 1] !== undefined) {
      return getColumnInfoFromSchema(column.substr(c[i].length + 1), f?.schema);
    } else if (f) {
      return { type: f.repeated ? `Repeated ${f.type}` : f.type, description: f.description };
    }
  }
  return null;
};
