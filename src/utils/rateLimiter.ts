/**
 * يقوم بتأخير التنفيذ لعدد معين من الميلي ثانية (مفيد لتجنب Discord Rate Limits).
 * @param ms عدد الميلي ثانية للتأخير
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * دالة مساعدة لتنفيذ مصفوفة من المهام بالتتابع مع وجود تأخير زمني بين كل مهمة وأخرى.
 * @param items المصفوفة التي سيتم المرور عليها
 * @param callback الدالة التي سيتم تنفيذها لكل عنصر
 * @param delayMs التأخير بالملي ثانية بين كل عملية
 */
export async function executeWithDelay<T, R>(
  items: T[],
  callback: (item: T, index: number) => Promise<R>,
  delayMs: number = 500
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      await delay(delayMs);
    }
    const res = await callback(items[i], i);
    results.push(res);
  }
  return results;
}
