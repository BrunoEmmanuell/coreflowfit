export function cn(...parts: Array<string | number | false | null | undefined>) : string {
  return parts.filter(Boolean).join(' ');
}

// default export também (alguns arquivos importam como default)
export default cn;
