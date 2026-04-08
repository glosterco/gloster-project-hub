type HierarchySource = {
  id?: number | string | null;
  descripcion: string;
  orden?: number | null;
};

export interface HierarchicalItem<T> {
  item: T;
  displayCode: string;
  cleanDescription: string;
  level: number;
  isSubitem: boolean;
  sortSegments: number[];
}

const ITEM_CODE_REGEX = /^\s*(\d+(?:\.\d+)*)\s*[-–—:]\s*(.+)\s*$/;

const compareSegments = (left: number[], right: number[]) => {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    if (leftValue == null) return -1;
    if (rightValue == null) return 1;
    if (leftValue !== rightValue) return leftValue - rightValue;
  }

  return 0;
};

export const extractItemCode = (descripcion: string) => {
  const match = descripcion.match(ITEM_CODE_REGEX);
  if (!match) return null;

  const code = match[1];
  return {
    code,
    cleanDescription: match[2].trim(),
    segments: code.split('.').map((segment) => Number.parseInt(segment, 10)).filter(Number.isFinite),
  };
};

export const prefixItemDescription = (code: string, description: string) => `${code} - ${description.trim()}`;

export const getNextSubitemCode = <T extends HierarchySource>(items: T[], parentCode: string) => {
  const parentSegments = parentCode.split('.').map((segment) => Number.parseInt(segment, 10));
  let maxChild = 0;

  items.forEach((item) => {
    const parsed = extractItemCode(item.descripcion);
    if (!parsed) return;

    const isDirectChild =
      parsed.segments.length === parentSegments.length + 1 &&
      parentSegments.every((segment, index) => parsed.segments[index] === segment);

    if (isDirectChild) {
      maxChild = Math.max(maxChild, parsed.segments[parsed.segments.length - 1] || 0);
    }
  });

  return [...parentSegments, maxChild + 1].join('.');
};

export const buildHierarchicalItems = <T extends HierarchySource>(items: T[]): HierarchicalItem<T>[] => {
  const baseSorted = [...items].sort((left, right) => {
    const orderDiff = (left.orden || 0) - (right.orden || 0);
    if (orderDiff !== 0) return orderDiff;
    return Number(left.id || 0) - Number(right.id || 0);
  });

  let topLevelIndex = 0;

  return baseSorted
    .map((item) => {
      const parsed = extractItemCode(item.descripcion);
      const sortSegments = parsed ? parsed.segments : [topLevelIndex + 1];

      if (!parsed) {
        topLevelIndex += 1;
      } else if (sortSegments[0] > topLevelIndex) {
        topLevelIndex = sortSegments[0];
      }

      return {
        item,
        displayCode: parsed?.code || String(parsed ? sortSegments[0] : topLevelIndex),
        cleanDescription: parsed?.cleanDescription || item.descripcion,
        level: Math.max(sortSegments.length - 1, 0),
        isSubitem: sortSegments.length > 1,
        sortSegments,
      };
    })
    .sort((left, right) => compareSegments(left.sortSegments, right.sortSegments));
};