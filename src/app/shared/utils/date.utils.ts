export function startOfToday(base = new Date()): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
}

export function combineDateAndTime(base: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function differenceInMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getTimeOfDay(date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }

  if (hour >= 17 && hour < 22) {
    return 'evening';
  }

  return 'night';
}

export function isWithinTimeRange(date: Date, startTime: string, endTime: string): boolean {
  const start = combineDateAndTime(date, startTime);
  const end = combineDateAndTime(date, endTime);
  return date >= start && date <= end;
}
