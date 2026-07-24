export const AVATAR_COLORS = ['#ef5350', '#66bb6a', '#ffa726', '#42a5f5', '#ab47bc', '#26c6da', '#ec407a', '#8d6e63'];

export function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
